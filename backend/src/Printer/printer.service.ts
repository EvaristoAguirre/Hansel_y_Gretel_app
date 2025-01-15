import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Printer from 'node-thermal-printer';

@Injectable()
export class PrinterService {
  //   private printer: Printer;
  //   constructor() {
  //     // Configurar la impresora
  //     this.printer = new Printer({
  //       type: 'epson', // Tipo de impresora
  //       interface: 'usb://192.168.0.100', // Dirección IP de la impresora
  //       characterSet: 'SLOVENIA', // Configuración de caracteres (ajusta según tu modelo)
  //     });
  //     // Verificar conexión con la impresora
  //     this.printer
  //       .isPrinterConnected()
  //       .then((connected) => {
  //         console.log('Printer connected:', connected);
  //       })
  //       .catch((err) => {
  //         console.error('Printer connection failed:', err);
  //       });
  //   }
  //   async printerOrder(order: any): Promise<void> {
  //     try {
  //       this.printer.clear();
  //       // Encabezado
  //       this.printer.alignCenter();
  //       this.printer.bold(true);
  //       this.printer.println('Hansel & Gretel');
  //       this.printer.println('--- COMANDA ---');
  //       this.printer.newLine();
  //       this.printer.bold(false);
  //       // Información del pedido
  //       this.printer.alignLeft();
  //       this.printer.println(`Mesa: ${order.table}`);
  //       this.printer.println(`Fecha: ${new Date().toLocaleString()}`);
  //       this.printer.newLine();
  //       // Detalles del pedido
  //       this.printer.println('Detalles:');
  //       order.items.forEach((item) => {
  //         this.printer.println(`- ${item.quantity} x ${item.name}`);
  //       });
  //       this.printer.newLine();
  //       this.printer.println('Gracias por su pedido.');
  //       this.printer.cut();
  //       // Enviar a la impresora
  //       await this.printer.execute();
  //       console.log('Comanda impresa exitosamente.');
  //     } catch (err) {
  //       console.error('Error al imprimir la comanda:', err);
  //     }
  //   }
}
