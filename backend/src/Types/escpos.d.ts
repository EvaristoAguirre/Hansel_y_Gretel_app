declare module 'escpos' {
    import { Printer, USB, Network, Serial } from 'escpos';
  
    export interface PrinterOptions {
      encoding?: string;
      width?: number;
    }
  
    export class Printer {
      constructor(device: any, options?: PrinterOptions);
      text(text: string): Printer;
      cut(): Printer;
      close(callback?: () => void): void;
      // Agrega otros métodos que uses
    }
  
    export const USB: {
      findPrinter(): Promise<any>;
      getDevice(): Promise<any>;
      new (vendorId?: number, productId?: number): any;
    };
  }
  
  declare module 'escpos-usb' {
    const content: any;
    export = content;
  }