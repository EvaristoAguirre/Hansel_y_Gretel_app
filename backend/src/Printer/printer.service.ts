import { Injectable } from '@nestjs/common';
import {
  ThermalPrinter,
  PrinterTypes,
  CharacterSet,
  BreakLine,
} from 'node-thermal-printer';

@Injectable()
export class PrinterService {
  private printer: ThermalPrinter;
  constructor() {
    this.printer = this.createPrinter();
  }

  private createPrinter(): ThermalPrinter {
    const printer = new ThermalPrinter({
      type: PrinterTypes.STAR,
      // interface: 'COM3',
      interface: 'tcp://192.168.1.49',
      // driver: {
      //   vid: 0x067B,
      //   pid: 0x2305
      // },
      characterSet: CharacterSet.PC850_MULTILINGUAL,
      removeSpecialCharacters: false,
      lineCharacter: '=',
      breakLine: BreakLine.WORD,
      options: {
        timeout: 4000,
      },
    });
    return printer;
  }

  async isConnect(): Promise<string> {
    console.log('arrancaaaa.....', this.printer);
    await this.printer.isPrinterConnected();
    return 'Impresora conectada testeo';
  }

  // async printTest(): Promise<string> {
  //   let execute = await this.printer.execute()
  //   console.log("execute: ", execute);
  //   // let raw = await this.printer.raw(Buffer.from("Hello world"));
  //   this.printer.print("Hola");
  //   return "execute";
  // }

  async printTest(): Promise<string> {
    try {
      // 1. Verificar conexión primero
      const isConnected = await this.printer.isPrinterConnected();
      if (!isConnected) {
        throw new Error('La impresora no está conectada');
      }

      // 2. Configurar la impresión
      this.printer.clear(); // Limpiar buffer previo
      this.printer.setCharacterSet(CharacterSet.PC850_MULTILINGUAL);
      this.printer.alignCenter();

      // 3. Añadir contenido
      this.printer.bold(true);
      this.printer.println('=== PRUEBA ===');
      this.printer.bold(false);
      this.printer.println('Hola mundo!');
      this.printer.println(new Date().toLocaleString());
      this.printer.println('--------------');
      this.printer.alignLeft();
      this.printer.println('Este es un ticket de prueba');
      this.printer.partialCut(); // Cortar papel (importante!)

      // 4. Ejecutar la impresión (esto debe ir AL FINAL)
      await this.printer.execute();
      console.log('Buffer a imprimir:', this.printer.getText());

      return 'Ticket impreso correctamente';
    } catch (error) {
      console.error('Error al imprimir:', error);
      throw new Error(`Error al imprimir: ${error.message}`);
    }
  }

  async printRawTest(): Promise<string> {
    const buffer = Buffer.from([
      ...Buffer.from('=== PRUEBA ===\n'),
      ...Buffer.from('Hola mundo!\n'),
      ...Buffer.from('\x1B\x69'), // Comando para cortar (depende del modelo)
    ]);

    await this.printer.raw(buffer);
    return 'Impresión RAW enviada';
  }
}
