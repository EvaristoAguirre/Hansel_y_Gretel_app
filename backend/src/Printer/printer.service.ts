import { Injectable, Logger } from '@nestjs/common';
import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import { PrintComandaDTO } from 'src/DTOs/print-comanda.dto';
import { Order } from 'src/Order/order.entity';
import { ProductsToExportDto } from 'src/DTOs/productsToExport.dto';

@Injectable()
export class PrinterService {
  readonly logger = new Logger(PrinterService.name);
  private counter: number = 0;
  private readonly counterFilePath = path.join(__dirname, 'print-counter.json');
  private readonly printerConfig = {
    host: '192.168.0.51',
    port: 9100,
    timeout: 5000,
  };

  constructor() {
    this.initializeCounter();
  }

  private initializeCounter(): void {
    try {
      if (fs.existsSync(this.counterFilePath)) {
        const data = fs.readFileSync(this.counterFilePath, 'utf8');
        this.counter = JSON.parse(data).counter || 0;
      }
    } catch (error) {
      this.logger.error('Error loading counter', error.stack);
      this.counter = 0;
    }
  }

  private saveCounter(): void {
    try {
      fs.writeFileSync(
        this.counterFilePath,
        JSON.stringify({
          counter: this.counter,
          lastUpdated: new Date().toISOString(),
        }),
      );
    } catch (error) {
      this.logger.error('Error saving counter', error.stack);
    }
  }

  private generateOrderCode(): string {
    const now = new Date();
    const datePart = now.toISOString().split('T')[0].replace(/-/g, '');
    const count = String(this.counter++).padStart(4, '0');
    this.saveCounter();
    return `${datePart}-${count}`;
  }

  private async sendRawCommand(command: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(this.printerConfig);

      socket.setTimeout(this.printerConfig.timeout);

      socket.on('connect', () => {
        this.logger.log('Printer connection established');
        socket.write(command, 'binary', (err) => {
          socket.end();
          if (err) {
            this.logger.error('Write error', err);
            reject(new Error('Error al enviar comandos a la impresora'));
          } else {
            resolve(true);
          }
        });
      });

      socket.on('error', (err) => {
        this.logger.error('Printer connection error', err);
        reject(new Error('Error de conexión con la impresora'));
      });

      socket.on('timeout', () => {
        this.logger.error('Printer connection timeout');
        socket.destroy();
        reject(
          new Error('Tiempo de espera agotado al conectar con la impresora'),
        );
      });
    });
  }

  async printKitchenOrder(orderData: PrintComandaDTO): Promise<string> {
    if (!orderData?.products?.length) {
      throw new Error('No products to print');
    }

    if (!orderData.table?.trim()) {
      throw new Error('Table name is required');
    }

    try {
      const now = new Date();
      const orderCode = this.generateOrderCode();

      const commands = [
        '\x1B\x40', // Inicializar impresora
        '\x1B\x74\x02', // Codificación Windows-1252
        '\x1B\x61\x02', // Alinear derecha
        '\x1D\x21\x11', // Texto doble tamaño
        `${orderData.isPriority ? '- PEDIDO PRIORITARIO -' : ' '} \n\n`,
        '\x1B\x61\x01', // Centrar
        '\x1D\x21\x11', // Texto doble tamaño
        '=== COMANDA COCINA ===\n',
        '\x1D\x21\x00', // Tamaño normal
        '----------------------------------------\n',
        `COD: ${orderCode}  ${now.toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}hs\n`,
        `MESA: ${this.normalizeText(orderData.table)}  PERSONAS: ${orderData.numberCustomers || 'N/A'}\n`,
        '----------------------------------------\n',
        '\x1B\x45\x01', // Negrita ON
        `PRODUCTO${' '.repeat(35)}CANT\n`,
        '\x1B\x45\x00', // Negrita OFF
        '----------------------------------------\n',
        '\x1D\x21\x00', // Tamaño normal para productos
        '\x1B\x4D\x00', // Tipografía estándar
        ...orderData.products.flatMap((p) => {
          const name = this.normalizeText(p.name.toLocaleUpperCase());
          const toppings = (p.toppings || []).map(
            (t) => `+ ${this.normalizeText(t)}\n`,
          );
          const comment = `${this.normalizeText(p.commentOfProduct || '')}\n`;
          const quantityText = `x${p.quantity.toString().padStart(2)}`;
          const maxLineLength = 48;
          const lines: string[] = [];

          lines.push('\x1B\x45\x01'); // Negrita ON

          if (name.length + quantityText.length + 1 <= maxLineLength) {
            lines.push(
              name.padEnd(maxLineLength - quantityText.length) + quantityText,
            );
          } else {
            const nameLine1 = name.substring(0, maxLineLength);
            const nameLine2 =
              name
                .substring(maxLineLength, maxLineLength * 2)
                .padEnd(maxLineLength - quantityText.length) + quantityText;
            lines.push(nameLine1);
            lines.push(nameLine2);
          }

          lines.push('\x1B\x45\x00'); // Negrita OFF

          if (toppings.length > 0) lines.push(...toppings);

          if (comment) {
            lines.push('\x1B\x61\x00'); // Alinear izquierda
            lines.push(comment);
            // lines.push('--------------------------\n');
            lines.push('\x1B\x61\x01'); // Centrar
            lines.push('\n');
          }

          lines.push(''); // espacio entre productos

          return lines;
        }),
        '\x1B\x61\x01', // Centrar
        '----------------------------------------\n',

        '\x1B\x42\x01\x02', // Pitido
        '\x1D\x56\x41\x30', // Cortar papel
      ].join('');

      const firstPrintSuccess = await this.sendRawCommand(commands);
      // const secondPrintSuccess = await this.sendRawCommand(commands);

      if (!firstPrintSuccess) {
        throw new Error('Print command failed');
      }

      return `Comanda impresa: ${orderCode}`;
    } catch (error) {
      this.logger.error(
        `Failed to print kitchen order: ${error.message}`,
        error.stack,
      );
      throw new Error(`Error al imprimir: ${error.message}`);
    }
  }

  private normalizeText(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  async printTicketOrder(order: Order): Promise<string> {
    if (!order?.orderDetails?.length) {
      throw new Error('No hay productos para imprimir en el ticket');
    }

    if (!order.table?.name?.trim()) {
      throw new Error('El nombre de la mesa es requerido');
    }

    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      });
      const timeStr = now.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const commandNumbers = order.orderDetails
        .filter((detail) => detail.isActive && detail.commandNumber)
        .map((detail) => detail.commandNumber);

      const commandNumberToPrint = commandNumbers
        .map((cn) => cn?.split('-')?.[1] || 'XXXX')
        .join('/');

      const tableName = order.table.name;
      //---------------------------------------------------------NO OLVIDARME EL NUMERO DE COMANDA
      // const commandNumber = commandNumberToPrint || 'S/N';

      const products = order.orderDetails
        .filter((detail) => detail.isActive)
        .map((detail) => ({
          name: detail.product?.name || 'Producto no disponible',
          quantity: detail.quantity,
          price: Number(detail.unitaryPrice),
        }));

      const subtotal = order.orderDetails.reduce(
        (sum, detail) => sum + Number(detail.unitaryPrice) * detail.quantity,
        0,
      );
      const tip = subtotal * 0.1;
      const total = subtotal + tip;

      const formatProductLine = (product: {
        name: string;
        quantity: number;
        price: number;
      }) => {
        const name = this.normalizeTextToTicket(product.name)
          .substring(0, 32)
          .padEnd(32);
        const quantity = `x${product.quantity.toString().padStart(2)}`;
        const price = `$${Math.round(product.price).toLocaleString('es-AR').padStart(5)}`;
        const totalLine = `Total: $${Math.round(
          product.price * product.quantity,
        )
          .toLocaleString('es-AR')
          .padStart(8)}`;

        return [
          `${quantity} ${name} ${price}`,
          `${' '.repeat(48 - totalLine.length)}${totalLine}`,
        ].join('\n');
      };

      const commands = [
        '\x1B\x40', // Inicializar impresora
        '\x1B\x74\x02', // Codificación Windows-1252
        '\x1B\x61\x01', // Centrar texto
        '\x1D\x21\x11', // Texto doble tamaño
        'HANSEL Y GRETEL\n',
        '\x1D\x21\x00', // Texto normal
        '-----------------------------------\n',
        `${dateStr} - ${timeStr}hs\n`,
        `Mesa: ${this.normalizeTextToTicket(tableName)}\n`,
        //---------------------------------------------------------NO OLVIDARME EL NUMERO DE COMANDA
        `\x1B\x61\x00`,
        `Comanda: ${commandNumberToPrint}\n`,
        '\x1B\x61\x01', // Centrar texto
        '-----------------------------------\n',
        '\x1B\x45\x01', // Negrita ON
        'CANT PRODUCTO              P.UNIT  \n',
        '\x1B\x45\x00', // Negrita OFF
        '-----------------------------------\n',
        ...products.map(formatProductLine),
        '-----------------------------------\n',
        '\x1B\x61\x02', // Alinear derecha
        // `Subtotal: $${subtotal.toFixed(2).padStart(8)}\n`,
        // `Propina sugerida (10%): $${tip.toFixed(2).padStart(6)}\n`,
        `Subtotal: $${Math.round(subtotal).toLocaleString('es-AR').padStart(6)}\n`,
        `Propina sugerida (10%): $${Math.round(tip).toLocaleString('es-AR').padStart(6)}\n`,

        '\x1B\x61\x01', // Centrar texto
        '\x1B\x45\x01', // Negrita ON
        '-----------------------------------\n',
        '\x1B\x61\x02', // Alinear derecha
        '\x1D\x21\x11', // Texto doble tamaño
        `\x1B\x4D\x01`, // 2da tipografia
        // `TOTAL (sin propina): $${subtotal.toFixed(2).padStart(10)}\n`,
        // `TOTAL (con propina): $${total.toFixed(2).padStart(10)}\n`,
        `TOTAL (sin propina): $${Math.round(subtotal).toLocaleString('es-AR').padStart(8)}\n`,
        '\x1B\x45\x00', // Negrita OFF
        '\x1B\x61\x01', // Centrar texto
        '\x1D\x21\x00', // Texto normal
        '-----------------------------------\n',
        '\x1B\x61\x02', // Alinear derecha
        '\x1B\x45\x01', // Negrita ON
        '\x1D\x21\x11', // Texto doble tamaño
        `\x1B\x4D\x01`, // 2da tipografia
        `TOTAL (con propina): $${Math.round(total).toLocaleString('es-AR').padStart(8)}\n`,
        '\x1B\x45\x00', // Negrita OFF
        '\x1B\x61\x01', // Centrar texto
        '\x1D\x21\x00', // Texto normal
        `\x1B\x4D\x00`,
        '-----------------------------------\n',
        'DOCUMENTO NO VALIDO COMO FACTURA\n',
        'Solicite su factura en caja.\n',
        'Gracias por su visita!\n',
        '\x1B\x42\x01\x02', // Pitido
        '\x1D\x56\x41\x50', // Cortar papel con avance
      ].join('');

      const firstPrintSuccess = await this.sendRawCommand(commands);
      const secondPrintSuccess = await this.sendRawCommand(commands);

      if (!firstPrintSuccess || !secondPrintSuccess) {
        throw new Error('Print command failed');
      }

      return `Ticket de pago impreso correctamente (Total: $${total.toFixed(2)})`;
    } catch (error) {
      this.logger.error(
        `Error al imprimir ticket: ${error.message}`,
        error.stack,
      );
      throw new Error(`Error al imprimir ticket: ${error.message}`);
    }
  }

  private normalizeTextToTicket(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // private splitCommentWithPrefix(
  //   comment: string,
  //   maxLineLength: number,
  //   prefix: string,
  // ): string[] {
  //   const prefixLength = prefix.length;
  //   const remainingLineLength = maxLineLength - prefixLength;
  //   const normalizedComment = this.normalizeText(comment);

  //   if (!normalizedComment) return [prefix];

  //   const lines: string[] = [];
  //   let firstLineContent = '';
  //   const words = normalizedComment.split(/(\s+)/);

  //   for (const word of words) {
  //     if ((firstLineContent + word).length <= remainingLineLength) {
  //       firstLineContent += word;
  //     } else {
  //       break;
  //     }
  //   }

  //   lines.push(`${prefix}${firstLineContent.trim()}`);

  //   const remainingText = normalizedComment
  //     .substring(firstLineContent.length)
  //     .trim();
  //   if (remainingText) {
  //     const remainingLines = this.splitTextIntoLines(
  //       remainingText,
  //       maxLineLength,
  //     );
  //     lines.push(...remainingLines);
  //   }

  //   return lines;
  // }

  private splitTextIntoLines(
    text: string,
    maxLength: number,
    prefix: string = '',
  ): string[] {
    const words = this.normalizeText(text).split(/(\s+)/);
    let currentLine = prefix;
    const lines = [];

    for (let word of words) {
      if ((currentLine + word).length > maxLength) {
        if (currentLine === prefix) {
          while (word.length > 0) {
            const chunk = word.substring(0, maxLength - prefix.length);
            lines.push(prefix + chunk);
            word = word.substring(maxLength - prefix.length);
          }
          continue;
        }
        lines.push(currentLine.trim());
        currentLine = prefix;
      }
      currentLine += word;
    }

    if (currentLine !== prefix) {
      lines.push(currentLine.trim());
    }

    return lines;
  }

  async printerStock(stockData: ProductsToExportDto[]) {
    try {
      const now = new Date();

      const dateFormatted = now.toLocaleDateString('es-Ar');
      const commands = [
        '\x1B\x40', // Inicializar impresora
        '\x1B\x74\x02', // Codificación Windows-1252
        '\x1B\x61\x01', // Centrar
        '\x1D\x21\x01', // Tamaño de texto mediano
        '=== STOCK ===\n',
        '\x1D\x21\x00', // Tamaño de texto normal
        `Fecha: ${dateFormatted}\n`,
        '----------------------------------------\n',
        '\x1B\x61\x00', // Alinear izquierda
        ...stockData.flatMap((item) => {
          const name = this.normalizeText(item.name.toUpperCase()).substring(
            0,
            40,
          );
          const quantity = this.formatNumber(item.quantityInStock);
          const unit = item.unitOfMeasure;
          const cost = `$ ${this.formatNumber(item.cost)}`;
          const lines: string[] = [];

          lines.push('\x1B\x45\x01'); // Negrita ON
          lines.push(`${name}`);
          lines.push('\x1B\x45\x00'); // Negrita OFF
          lines.push(`Cantidad: ${quantity} ${unit}`);
          lines.push(`Costo:    ${cost}`);
          lines.push(''); // Espacio entre productos

          return lines;
        }),
        '----------------------------------------\n',
        '\x1B\x42\x01\x02', // Pitido
        '\x1D\x56\x41\x30', // Cortar papel
      ].join('\n');

      const printSuccess = await this.sendRawCommand(commands);

      if (!printSuccess) {
        throw new Error('Print command failed');
      }

      return 'Reporte de stock impreso correctamente.';
    } catch (error) {
      this.logger.error(
        `Error al imprimir reporte de stock: ${error.message}`,
        error.stack,
      );
      throw new Error(`Error al imprimir: ${error.message}`);
    }
  }

  private formatNumber(value: number | null | undefined): string {
    return (value ?? 0).toLocaleString('es-AR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    });
  }
}
