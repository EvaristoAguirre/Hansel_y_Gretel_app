// import { Injectable } from '@nestjs/common';
// import * as fs from 'fs';
// import * as path from 'path';
// import * as net from 'net';
// import { PrintComandaDTO } from 'src/DTOs/print-comanda.dto';

// @Injectable()
// export class PrinterService {
//   private counter: number = 0;
//   private readonly counterFilePath = path.join(__dirname, 'print-counter.json');
//   private readonly printerHost = '192.168.1.49';
//   private readonly printerPort = 9100;

//   constructor() {
//     this.loadCounter();
//   }

//   private loadCounter(): void {
//     try {
//       if (fs.existsSync(this.counterFilePath)) {
//         const data = fs.readFileSync(this.counterFilePath, 'utf8');
//         this.counter = JSON.parse(data).counter;
//       }
//     } catch (error) {
//       console.error('Error loading counter:', error);
//       this.counter = 0;
//     }
//   }

//   private saveCounter(): void {
//     try {
//       fs.writeFileSync(
//         this.counterFilePath,
//         JSON.stringify({
//           counter: this.counter,
//         }),
//       );
//     } catch (error) {
//       console.error('Error saving counter:', error);
//     }
//   }

//   private generateOrderCode(): string {
//     const now = new Date();
//     const year = now.getFullYear();
//     const month = String(now.getMonth() + 1).padStart(2, '0');
//     const day = String(now.getDate()).padStart(2, '0');
//     const count = String(this.counter++).padStart(4, '0');
//     this.saveCounter();
//     return `${year}-${month}-${day}-${count}`;
//   }

//   private async sendRawCommand(command: string): Promise<string> {
//     return new Promise((resolve, reject) => {
//       const socket = net.createConnection({
//         host: this.printerHost,
//         port: this.printerPort,
//       });

//       socket.on('connect', () => {
//         socket.write(command, (error) => {
//           socket.end();
//           if (error) {
//             reject(error);
//           } else {
//             resolve('comanda impresa correctamente');
//           }
//         });
//       });

//       socket.on('error', (error) => {
//         reject(error);
//       });
//     });
//   }

//   // async printKitchenOrder(orderData: PrintComandaDTO): Promise<string> {
//   //   const now = new Date();
//   //   const orderCode = this.generateOrderCode();
//   //   console.log('dataaaaaa.......', orderData);

//   //   const formatProductLine = (name: string, quantity: number) => {
//   //     const namePart = name.padEnd(20).substring(0, 20);
//   //     const quantityPart = `x${quantity.toString().padStart(2)}`;
//   //     return `${namePart} ${quantityPart}\n`;
//   //   };

//   //   const commands = [
//   //     '\x1B\x40', // Inicializar impresora
//   //     '\x1B\x61\x01', // Centrar texto
//   //     '\x1D\x21\x01', // Texto doble altura
//   //     'COMANDA COCINA\n',
//   //     '\x1D\x21\x00', // Texto normal
//   //     '-----------------------------\n',
//   //     `Código: ${orderCode}\n`,
//   //     `Mesa: ${orderData.table}\n`,
//   //     `Hora: ${now.toLocaleTimeString()}\n`,
//   //     '-----------------------------\n',
//   //     '\x1B\x45\x01', // Negrita ON
//   //     'PRODUCTO             CANT.\n',
//   //     '\x1B\x45\x00', // Negrita OFF
//   //     '-----------------------------\n',
//   //     ...orderData.products.map((p) => formatProductLine(p.name, p.quantity)),
//   //     '-----------------------------\n',
//   //     '\x1B\x61\x01', // Centrar texto
//   //     'Por favor preparar con cuidado\n',
//   //     '\x1B\x42\x02\x02', // Doble pitido
//   //     '\x1D\x56\x41\x50', // Cortar papel (con avance)
//   //   ].join('');

//   //   return this.sendRawCommand(commands);
//   // }

//   async printKitchenOrder(orderData: PrintComandaDTO): Promise<string> {
//     if (!orderData.products || orderData.products.length === 0) {
//       throw new Error('No hay productos para imprimir en la comanda');
//     }
//     const now = new Date();
//     const orderCode = this.generateOrderCode();

//     // Función para formatear líneas de productos
//     const formatProductLine = (name: string, quantity: number) => {
//       const namePart = name.padEnd(20).substring(0, 20); // Limita a 20 caracteres
//       const quantityPart = `x${quantity.toString().padStart(2)}`;
//       return `${namePart} ${quantityPart}\n`;
//     };

//     // Encabezado con información importante
//     const header = [
//       '\x1B\x40', // Inicializar impresora
//       '\x1B\x61\x01', // Centrar texto
//       '\x1D\x21\x01', // Texto doble altura
//       'COMANDA COCINA\n',
//       '\x1D\x21\x00', // Texto normal
//       '-----------------------------\n',
//       `Código: ${orderCode}\n`,
//       `Mesa: ${orderData.table}\n`,
//       `Hora: ${now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}\n`,
//       '-----------------------------\n',
//       '\x1B\x45\x01', // Negrita ON
//       'PRODUCTO             CANT.\n',
//       '\x1B\x45\x00', // Negrita OFF
//       '-----------------------------\n',
//     ];

//     // Cuerpo con los productos
//     const body = orderData.products.map((p) =>
//       formatProductLine(p.name, p.quantity),
//     );

//     // Pie de página
//     const footer = [
//       '-----------------------------\n',
//       '\x1B\x61\x01', // Centrar texto
//       'Por favor preparar con cuidado\n',
//       '\x1B\x42\x02\x02', // Doble pitido
//       '\x1D\x56\x41\x50', // Cortar papel (con avance)
//     ];

//     // Combinar todos los componentes
//     const commands = [...header, ...body, ...footer].join('');

//     try {
//       await this.sendRawCommand(commands);
//       return `Comanda impresa correctamente (${orderCode})`;
//     } catch (error) {
//       console.error('Error al imprimir comanda:', error);
//       throw new Error('No se pudo imprimir la comanda');
//     }
//   }
// }

import { Injectable, Logger } from '@nestjs/common';
import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import { PrintComandaDTO } from 'src/DTOs/print-comanda.dto';

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

      // Preparar comandos ESC/POS
      const commands = [
        '\x1B\x40', // Inicializar impresora
        '\x1B\x74\x02', // Establecer codificación Windows-1252 (para caracteres latinos)
        '\x1B\x61\x01', // Centrar texto
        '\x1D\x21\x11', // Texto doble tamaño
        'COMANDA COCINA\n\n',
        '\x1D\x21\x00', // Texto normal
        '------------------------------\n',
        `COD: ${orderCode}  ${now.toLocaleTimeString('es-AR')}\n`,
        `MESA: ${this.normalizeText(orderData.table)}\n`,
        '------------------------------\n',
        '\x1B\x45\x01', // Negrita ON
        `${'PRODUCTO'.padEnd(22)}CANT\n`,
        '\x1B\x45\x00', // Negrita OFF
        '------------------------------\n',
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
}
