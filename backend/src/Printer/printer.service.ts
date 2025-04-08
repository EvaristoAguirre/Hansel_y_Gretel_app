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

  // async printTest(): Promise<string> {
  //   try {
  //     // 1. Verificar conexión primero
  //     const isConnected = await this.printer.isPrinterConnected();
  //     if (!isConnected) {
  //       throw new Error('La impresora no está conectada');
  //     }

  //     // 2. Configurar la impresión
  //     this.printer.clear(); // Limpiar buffer previo
  //     this.printer.setCharacterSet(CharacterSet.PC850_MULTILINGUAL);
  //     this.printer.alignCenter();

  //     // 3. Añadir contenido
  //     this.printer.bold(true);
  //     this.printer.println('=== PRUEBA ===');
  //     this.printer.bold(false);
  //     this.printer.println('Hola mundo!');
  //     this.printer.println(new Date().toLocaleString());
  //     this.printer.println('--------------');
  //     this.printer.alignLeft();
  //     this.printer.println('Este es un ticket de prueba');
  //     this.printer.beep();
  //     this.printer.cut({ verticalTabAmount: 3 }); // Cortar papel (importante!)

  //     // 4. Ejecutar la impresión (esto debe ir AL FINAL)
  //     await this.printer.execute();
  //     console.log('Buffer a imprimir:', this.printer.getText());

  //     return 'Ticket impreso correctamente';
  //   } catch (error) {
  //     console.error('Error al imprimir:', error);
  //     throw new Error(`Error al imprimir: ${error.message}`);
  //   }
  // }

  async printRawTest(): Promise<string> {
    const buffer = Buffer.from([
      ...Buffer.from('=== PRUEBA ===\n'),
      ...Buffer.from('Hola mundo!\n'),
      ...Buffer.from('\x1B\x69'), // Comando para cortar (depende del modelo)
    ]);

    await this.printer.raw(buffer);
    return 'Impresión RAW enviada';
  }

  async printTest(): Promise<string> {
    try {
      // 1. Verificar conexión primero
      const isConnected = await this.printer.isPrinterConnected();
      if (!isConnected) {
        throw new Error('La impresora no está conectada');
      }

      // 2. Configurar la impresora
      this.printer.alignCenter(); // Centrar el texto

      // 3. Añadir contenido del ticket
      this.printer.bold(true); // Texto en negrita
      this.printer.underline(true);
      this.printer.println('=== PRUEBA ===');
      this.printer.bold(false); // Desactivar negrita
      this.printer.underline(false);

      this.printer.println('Tienda: MI TIENDA');
      this.printer.println('Fecha: ' + new Date().toLocaleString());
      this.printer.newLine(); // Línea en blanco

      this.printer.println('Este es un ticket de prueba');
      this.printer.println('para verificar la conexión');
      this.printer.newLine();

      // Ejemplo de tabla
      this.printer.tableCustom([
        { text: 'Artículo', align: 'LEFT', width: 0.1 },
        { text: 'Cant.', align: 'CENTER', width: 0.1 },
        { text: 'Precio', align: 'RIGHT', width: 0.1 },
      ]);
      this.printer.tableCustom([
        { text: 'Producto 1', align: 'LEFT', width: 0.1 },
        { text: '2', align: 'CENTER', width: 0.1 },
        { text: '$10.00', align: 'RIGHT', width: 0.1 },
      ]);

      this.printer.newLine();
      this.printer.println('Gracias por su visita!');
      this.printer.newLine();
      this.printer.newLine();
      this.printer.newLine();
      this.printer.newLine();

      await this.printer.execute();

      const buffer = Buffer.from([...Buffer.from('\x1B\x69')]);
      await this.printer.raw(buffer);
      return 'Ticket de prueba impreso correctamente';
    } catch (error) {
      console.error('Error al imprimir ticket de prueba:', error);
      throw new Error(`Error al imprimir: ${error.message}`);
    }
  }
}
