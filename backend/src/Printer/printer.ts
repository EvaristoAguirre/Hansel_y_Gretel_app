import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine  } from "node-thermal-printer";


// export class printer = new ThermalPrinter({
//   type: PrinterTypes.EPSON,
//   interface: 'printer:POS-80C',
//   // driver: {
//   //   vid: '0x067B',
//   //   pid: '0x2305'
//   // },
//   characterSet: CharacterSet.SLOVENIA,
//   removeSpecialCharacters: false,
//   lineCharacter: '=',
//   breakLine: BreakLine.WORD,
//   options: {
//     timeout: 4000
//   };
// });



// declare module 'node-thermal-printer' {

   
//     // Métodos básicos
//     clear(): void;
//     alignCenter(): void;
//     alignLeft(): void;
//     alignRight(): void;
//     bold(value: boolean): void;
//     underline(value: boolean): void;
//     invert(value: boolean): void;
//     println(text: string): void;
//     newLine(): void;
//     cut(): void;
//     partialCut(): void;
//     beep(): void;
    
//     // Métodos avanzados
//     printImage(imagePath: string): Promise<void>;
//     printQR(text: string, settings?: QRConfig): void;
//     setCharacterSet(charSet: string): void;
//     setTypeFontA(): void;
//     setTypeFontB(): void;
    
//     // Control de impresión
//     execute(): Promise<void>;
//     execute(callback: (error: Error | null) => void): void;
//     isPrinterConnected(): Promise<boolean>;
    
//     // Propiedades
//     buffer: Buffer;
//     printer: any;
 

//   export interface PrinterConfig {
//     type: 'epson' | 'star' | 'escpos';
//     interface: string;
//     characterSet?: string;
//     removeSpecialCharacters?: boolean;
//     lineCharacter?: string;
//     options?: {
//       timeout?: number;
//     };
//     width?: number;
//     driver?: any;
//   }

//   export interface QRConfig {
//     cellSize?: number;
//     correction?: 'L' | 'M' | 'Q' | 'H';
//     model?: number;
//   }

//   // Tipos de impresora
//   export const types: {
//     EPSON: 'epson';
//     STAR: 'star';
//     ESCPOS: 'escpos';
//   };

//   // Charsets disponibles
//   export const characterSets: {
//     PC437_USA: string;
//     PC860_PORTUGUESE: string;
//     // Agrega otros charsets según necesites
//   };
// 
