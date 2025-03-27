import { Injectable, Logger } from '@nestjs/common';
import * as escpos from 'escpos';
import * as escposUSB from 'escpos-usb';
import { RPT008_CONFIG } from './printer.constants';
import { PrintOptions } from './printer.interface';

// Configuración del plugin USB
escpos.USB = escposUSB;

@Injectable()
export class PrinterService {
  private readonly logger = new Logger(PrinterService.name);
  private printer: any;
  private device: any;

  constructor() {
    this.initializePrinter();
  }

  private async initializePrinter() {
    try {
      // Configuración específica para 3nStar RPT008
      this.device = new escpos.USB(
        RPT008_CONFIG.vendorId, 
        RPT008_CONFIG.productId
      );
      
      this.printer = new escpos.Printer(this.device, {
        encoding: RPT008_CONFIG.encoding,
        width: RPT008_CONFIG.width
      });
      
      this.logger.log('Impresora 3nStar RPT008 inicializada');
    } catch (error) {
      this.logger.error('Error al inicializar impresora:', error.message);
      throw error;
    }
  }

  async printText(text: string, options?: PrintOptions): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.device.open((error: any) => {
        if (error) return reject(error);

        try {
          this.printer
            .font(options?.font || 'A')
            .align(options?.align || 'LT')
            .style(options?.style || 'NORMAL')
            .size(options?.width || 1, options?.height || 1)
            .text(text)
            .cut(options?.cut ? true : false)
            .close(() => resolve(true));
        } catch (printError) {
          reject(printError);
        }
      });
    });
  }

  async printTestPage(): Promise<boolean> {
    const testText = `
==============================
       PRUEBA IMPRESORA
        3nStar RPT008
==============================
Fecha: ${new Date().toLocaleString()}
------------------------------
Este es un texto de prueba
para verificar la conexión
------------------------------
    `;

    return this.printText(testText, {
      align: 'CT',
      font: 'B',
      cut: true
    });
  }
}