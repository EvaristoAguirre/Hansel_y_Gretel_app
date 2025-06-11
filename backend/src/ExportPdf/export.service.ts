import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit-table';
import { StockService } from 'src/Stock/stock.service';
import * as fs from 'fs';

@Injectable()
export class ExportService {
  constructor(private stockService: StockService) {}

  async generateStockPDF(): Promise<Buffer> {
    const stockData = await this.stockService.stockToExport();

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const logoPath = 'src/ExportPdf/logo.jpg';
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, doc.page.width - 130, 20, { width: 100 });
      }
      doc.moveDown();
      doc.moveDown();
      doc.moveDown();

      // Título del documento
      doc.fontSize(15).text('Reporte de Stock', { align: 'center' });
      doc.moveDown();

      // Preparar datos para la tabla
      const tableData = {
        headers: [
          'Nombre',
          'Cant. Actual',
          'Unidad',
          'Costo Unitario',
          'Cant. Comprada',
          'Precio pagado',
        ],
        rows: stockData.map((item) => {
          const isIngredient = !!item.ingredient;
          const name = isIngredient ? item.ingredient.name : item.product.name;

          const cost = isIngredient
            ? `$${parseFloat(item.ingredient.cost).toFixed(1)}`
            : `$${parseFloat(item.product.cost).toFixed(1)}`;

          return [
            name,
            item.quantityInStock,
            item.unitOfMeasure.abbreviation,
            cost,
            '',
            '',
          ];
        }),
      };

      // Configuración CORREGIDA de la tabla
      const tableOptions = {
        width: 500,
        x: 50,
        y: doc.y,
        divider: {
          header: { disabled: false, width: 1 },
          horizontal: { disabled: false, width: 0.5 },
        },
      };

      // Generar la tabla
      doc.table(tableData, tableOptions);
      doc.end();
    });
  }
}
