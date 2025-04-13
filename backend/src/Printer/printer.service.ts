import { Injectable } from '@nestjs/common';
import {
  ThermalPrinter,
  PrinterTypes,
  CharacterSet,
  BreakLine,
} from 'node-thermal-printer';
import { Star } from './commands';

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
      width: 48,
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

      this.printer.alignLeft();
      this.printer.println('Este es un ticket de prueba');
      this.printer.println('para verificar la conexión');
      this.printer.newLine();

      // Ejemplo de tabla
      this.printer.tableCustom([
        { text: 'Artículo', align: 'LEFT', width: 0.25 },
        { text: 'Cant.', align: 'CENTER', width: 0.25 },
        { text: 'Precio', align: 'RIGHT', width: 0.25 },
      ]);
      this.printer.tableCustom([
        { text: 'Producto 1', align: 'LEFT', width: 0.25 },
        { text: '2', align: 'CENTER', width: 0.25 },
        { text: '$10.00', align: 'RIGHT', width: 0.25 },
      ]);

      this.printer.newLine();
      this.printer.println('Gracias por su visita!');
      this.printer.add(Star.TXT_2HEIGHT);
      this.printer.add(Buffer.from('Telefono: 123-456-7890'));
      this.printer.newLine();
      this.printer.newLine();
      this.printer.newLine();
      this.printer.newLine();

      await this.printer.execute();

      const buffer = Buffer.from([...Buffer.from('\x1B\x69')]);
      // corto correctamente
      // const buffer = Buffer.from([...Buffer.from(commands.PAPER_PART_CUT)]);
      await this.printer.raw(buffer);
      return 'Ticket de prueba impreso correctamente';
    } catch (error) {
      console.error('Error al imprimir ticket de prueba:', error);
      throw new Error(`Error al imprimir: ${error.message}`);
    }
  }

  // async printTest2() {
  //   try {
  //     //  1. Verificar conexión primero
  //     const isConnected = await this.printer.isPrinterConnected();
  //     if (!isConnected) {
  //       throw new Error('La impresora no está conectada');
  //     }
  //     // Inicializar impresora
  //     this.printer.append(Buffer.from(commands.HW_INIT));

  //     // Centrar texto
  //     this.printer.append(Buffer.from(commands.TXT_ALIGN_CT));

  //     // Texto doble altura
  //     this.printer.append(Buffer.from(commands.TXT_2HEIGHT));
  //     this.printer.append(Buffer.from('TICKET EJEMPLO\n'));

  //     // Volver a normal
  //     this.printer.append(Buffer.from(commands.TXT_NORMAL));

  //     // Cortar papel
  //     // this.printer.append(Buffer.from(commands.PAPER_PART_CUT));
  //     const buffer = Buffer.from([...Buffer.from(commands.PAPER_PART_CUT)]);
  //     await this.printer.raw(buffer);
  //     console.log('Ticket impreso correctamente');
  //   } catch (error) {
  //     console.error('Error al imprimir:', error);
  //   }
  // }

  async printTest3(): Promise<string> {
    try {
      // 1. Verificar conexión primero
      const isConnected = await this.printer.isPrinterConnected();
      if (!isConnected) {
        throw new Error('La impresora no está conectada');
      }
      // 2. Configurar la impresora
      this.printer.add(Star.TXT_ALIGN_LT); // Centrar el texto

      this.printer.add(Star.TXT_BOLD_ON); // Texto en negrita
      this.printer.add(Buffer.from('=== PRUEBA ==='));
      this.printer.add(Buffer.from(Star.TXT_BOLD_OFF)); // Desactivar negrita
      this.printer.newLine(); // Línea en blanco
      this.printer.add(Buffer.from('Tienda: MI TIENDA'));
      this.printer.newLine(); // Línea en blanco
      this.printer.add(Buffer.from('Fecha: ' + new Date().toLocaleString()));
      this.printer.newLine(); // Línea en blanco
      this.printer.newLine(); // Línea en blanco
      this.printer.newLine(); // Línea en blanco
      this.printer.newLine(); // Línea en blanco
      this.printer.add(Star.TXT_2HEIGHT);
      this.printer.add(Buffer.from('Telefono: 123-456-7890'));
      this.printer.newLine();
      this.printer.newLine();
      this.printer.newLine();
      this.printer.newLine();

      await this.printer.execute();

      const buffer = Buffer.from([...Buffer.from('\x1B\x69')]);
      // corto correctamente
      // const buffer = Buffer.from([...Buffer.from(commands.PAPER_PART_CUT)]);
      await this.printer.raw(buffer);
      return 'Ticket de prueba impreso correctamente';
    } catch (error) {
      console.error('Error al imprimir ticket de prueba:', error);
      throw new Error(`Error al imprimir: ${error.message}`);
    }
  }
}
