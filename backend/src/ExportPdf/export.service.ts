import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';

@Injectable()
export class ExportService {
  async generateStockPDF(stockData: any[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Título
      doc.fontSize(20).text('Reporte de Stock', { align: 'center' });
      doc.moveDown();

      // Tabla de stock
      stockData.forEach((item) => {
        doc
          .fontSize(12)
          .text(`Producto: ${item.name}`, { continued: true })
          .text(` | Stock: ${item.quantity}`, { continued: true })
          .text(` | Mínimo: ${item.minStock}`, { align: 'right' });
        doc.moveDown();
      });

      doc.end();
    });
  }
}
