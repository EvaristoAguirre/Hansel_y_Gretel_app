import { Injectable } from '@nestjs/common';
// import Printer from 'node-thermal-printer';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ThermalPrinter = require('node-thermal-printer').printer;
@Injectable()
export class PrinterService {
  private printer: any;
  constructor() {
    // Configurar la impresora
    this.printer = new ThermalPrinter({
      type: 'epson', // Tipo de impresora
      interface: 'tcp://192.168.123.146', // Dirección IP de la impresora
      characterSet: 'SLOVENIA', // Configuración de caracteres (ajusta según tu modelo)
    });
    // Verificar conexión con la impresora
    this.printer
      .isPrinterConnected()
      .then((connected) => {
        console.log('Printer connected:', connected);
      })
      .catch((err) => {
        console.error('Printer connection failed:', err);
      });
  }
  async printerOrder(): Promise<void> {
    try {
      this.printer.clear();
      // Encabezado
      this.printer.alignCenter();
      this.printer.bold(true);
      this.printer.println('Hansel & Gretel');
      this.printer.println('--- COMANDA ---');
      this.printer.newLine();
      this.printer.newLine();
      this.printer.newLine();
      this.printer.newLine();
      this.printer.bold(false);

      // ---------------- Probando impresora -----------
      this.printer.alignCenter();
      this.printer.bold(true);
      this.printer.println('Se vienen cositas...!!');
      this.printer.newLine();
      this.printer.newLine();
      this.printer.bold(false);
      this.printer.cut();
      // Información del pedido
      // this.printer.alignLeft();
      // this.printer.println(`Mesa: ${order.table}`);
      // this.printer.println(`Fecha: ${new Date().toLocaleString()}`);
      // this.printer.newLine();

      // Detalles del pedido
      // this.printer.println('Detalles:');
      // order.items.forEach((item) => {
      //   this.printer.println(`- ${item.quantity} x ${item.name}`);
      // });
      // this.printer.newLine();
      // this.printer.println('Gracias por su pedido.');
      // this.printer.cut();

      // Enviar a la impresora
      await this.printer.execute();
      console.log('Comanda impresa exitosamente.');
    } catch (err) {
      console.error('Error al imprimir la comanda:', err);
    }
  }
}
