// // Tipos de impresoras compatibles
// export type PrinterType = 'star' | 'epson' | 'escpos';

// // Configuración base
// export interface PrinterConfig {
//   type: PrinterType;
//   interface: string;
//   options?: {
//     encoding?: string;
//     timeout?: number;
//   };
// }

// // Datos para imprimir
// export interface PrintData {
//   type: 'text' | 'barcode' | 'image';
//   content: string | Buffer;
//   align?: 'left' | 'center' | 'right';
//   size?: 'small' | 'normal' | 'large';
// }

// // Plantillas
// export interface TemplateData {
//   header?: string;
//   lines: { text: string; price?: number }[];
//   footer?: string;
// }

// export interface PrintOptions {
//   cut?: boolean;
//   encoding?: string;
//   margin?: number;
// }

// export interface ImageOptions {
//   width?: number;
//   height?: number;
//   threshold?: number;
// }
