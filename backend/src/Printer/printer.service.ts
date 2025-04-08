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
      this.printer.beep();
      this.printer.cut({ verticalTabAmount: 3 }); // Cortar papel (importante!)

      // 4. Ejecutar la impresión (esto debe ir AL FINAL)
      await this.printer.execute();
      console.log('Buffer a imprimir:', this.printer.getText());

      return 'Ticket impreso correctamente';
    } catch (error) {
      console.error('Error al imprimir:', error);
      throw new Error(`Error al imprimir: ${error.message}`);
    }
  }

  // async printRawTest(): Promise<string> {
  //   const buffer = Buffer.from([
  //     ...Buffer.from('=== PRUEBA ===\n'),
  //     ...Buffer.from('Hola mundo!\n'),
  //     ...Buffer.from('\x1B\x69'), // Comando para cortar (depende del modelo)
  //   ]);

  //   await this.printer.raw(buffer);
  //   return 'Impresión RAW enviada';
  // }

  async printRawTest(): Promise<string> {
    try {
      // 1. Verificar conexión primero
      const isConnected = await this.printer.isPrinterConnected();
      if (!isConnected) {
        throw new Error('La impresora no está conectada');
      }

      // 2. Configurar la impresión (usando el método de alto nivel)
      this.printer.clear();
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

      // 4. Ejecutar la impresión del texto
      await this.printer.execute();

      // 5. Enviar comando RAW para el corte de papel
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const cutCommand = Buffer.from('\x1B\x69', 'ascii'); // Comando de corte que funciona
      await this.printer.raw(cutCommand);

      return 'Ticket impreso y cortado correctamente';
    } catch (error) {
      console.error('Error al imprimir:', error);
      throw new Error(`Error al imprimir: ${error.message}`);
    }
  }

  //   async printRawTest(): Promise<string> {
  //     try {
  //       // Crear el contenido del ticket
  //       const content = [
  //         '=== PRUEBA ===\n',
  //         'Hola mundo!\n',
  //         new Date().toLocaleString() + '\n',
  //         '--------------\n',
  //         'Este es un ticket de prueba\n',
  //       ].join('');

  //       // Convertir a buffer con codificación correcta
  //       const textBuffer = Buffer.from(content, 'utf8');

  //       // Comando de corte (ajusta según tu modelo de impresora)
  //       const cutCommand = Buffer.from('\x1B\x69', 'ascii');

  //       // Combinar ambos buffers
  //       // const fullBuffer = Buffer.concat([textBuffer, cutCommand]);

  //       // Enviar a la impresora
  //       // await this.printer.raw(fullBuffer);
  //       await this.printer.execute();
  // await new Promise(resolve => setTimeout(resolve, 500)); // Espera 500ms
  // await this.printer.raw(Buffer.from('\x1D\x56\x00', 'ascii')); // Corte completo

  //       return 'Impresión RAW mejorada enviada';
  //     } catch (error) {
  //       console.error('Error al imprimir:', error);
  //       throw new Error(`Error al imprimir: ${error.message}`);
  //     }
  //   }
}
