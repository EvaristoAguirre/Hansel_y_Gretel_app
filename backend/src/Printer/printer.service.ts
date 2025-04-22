import { Injectable, Logger } from '@nestjs/common';
import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import { PrintComandaDTO } from 'src/DTOs/print-comanda.dto';
import { Order } from 'src/Order/order.entity';

@Injectable()
export class PrinterService {
  readonly logger = new Logger(PrinterService.name);
  private counter: number = 0;
  private readonly counterFilePath = path.join(__dirname, 'print-counter.json');
  private readonly printerConfig = {
    host: '192.168.1.49',
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

  private normalizeText(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
            reject(false);
          } else {
            resolve(true);
          }
        });
      });

      socket.on('error', (err) => {
        this.logger.error('Printer connection error', err);
        reject(false);
      });

      socket.on('timeout', () => {
        this.logger.error('Printer connection timeout');
        socket.destroy();
        reject(false);
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
        '\x1B\x74\x02', // Establecer codificación Windows-1252 (para caracteres latinos)
        '\x1B\x61\x01', // Centrar texto
        '\x1D\x21\x11', // Texto doble tamaño
        'COMANDA COCINA\n\n',
        '\x1D\x21\x00', // Texto normal
        '------------------------------\n',
        '\x1D\x21\x11', // Texto doble tamaño
        `COD: ${orderCode}  ${now.toLocaleTimeString('es-AR')}\n`,
        '\x1D\x21\x00', // Texto normal
        `MESA: ${this.normalizeText(orderData.table)}  PERSONAS: ${orderData.numberCustomers || 'N/A'}\n`,
        '------------------------------\n',
        '\x1B\x45\x01', // Negrita ON
        `${'PRODUCTO'.padEnd(22)}CANT\n`,
        '\x1B\x45\x00', // Negrita OFF
        '------------------------------\n',
        '\x1D\x21\x11', // Texto doble tamaño
        ...orderData.products.map(
          (p) =>
            `${this.normalizeText(p.name).substring(0, 22).padEnd(22)}x ${p.quantity.toString().padStart(2)}\n`,
        ),
        '------------------------------\n',
        '\x1B\x42\x01\x02', // Pitido
        '\x1D\x56\x41\x30', // Cortar papel
      ].join('');

      const printSuccess = await this.sendRawCommand(commands);
      if (!printSuccess) {
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
      });

      const tableName = order.table.name;
      const commandNumber = order.commandNumber || 'S/N';

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
          .substring(0, 20)
          .padEnd(20);
        const quantity = `x${product.quantity.toString().padStart(2)}`;
        const price = `$${product.price.toFixed(2).padStart(6)}`;
        const total = `$${(product.price * product.quantity).toFixed(2).padStart(7)}`;
        return `${quantity} ${name} ${price} ${total}\n`;
      };

      const commands = [
        '\x1B\x40', // Inicializar impresora
        '\x1B\x74\x02', // Codificación Windows-1252
        '\x1B\x61\x01', // Centrar texto
        '\x1D\x21\x11', // Texto doble tamaño
        'HANSEL Y GRETEL\n',
        '\x1D\x21\x00', // Texto normal
        '-----------------------------\n',
        `${dateStr} - ${timeStr}\n`,
        `Mesa: ${this.normalizeTextToTicket(tableName)}\n`,
        `Comanda: ${commandNumber}\n`,
        '-----------------------------\n',
        '\x1B\x45\x01', // Negrita ON
        'CANT PRODUCTO           P.UNIT  TOTAL\n',
        '\x1B\x45\x00', // Negrita OFF
        '-----------------------------\n',
        ...products.map(formatProductLine),
        '-----------------------------\n',
        '\x1B\x61\x02', // Alinear derecha
        `Subtotal: $${subtotal.toFixed(2).padStart(8)}\n`,
        `Propina sugerida (10%): $${tip.toFixed(2).padStart(6)}\n`,
        '\x1B\x61\x01', // Centrar texto
        '\x1B\x45\x01', // Negrita ON
        '-----------------------------\n',
        '\x1B\x61\x02', // Alinear derecha
        '\x1D\x21\x11', // Texto doble tamaño
        `TOTAL (sin propina): $${subtotal.toFixed(2).padStart(10)}\n`,
        `TOTAL (con propina): $${total.toFixed(2).padStart(10)}\n`,
        '\x1B\x45\x00', // Negrita OFF
        '\x1B\x61\x01', // Centrar texto
        '-----------------------------\n',
        'DOCUMENTO NO VALIDO COMO FACTURA\n',
        'Solicite su factura en caja.\n',
        'Gracias por su visita!\n',
        '\x1B\x42\x01\x02', // Pitido
        '\x1D\x56\x41\x50', // Cortar papel con avance
      ].join('');

      const printSuccess = await this.sendRawCommand(commands);
      if (!printSuccess) {
        throw new Error('Error al enviar comando de impresión');
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
}
