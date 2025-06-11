import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit-table';
import { StockService } from 'src/Stock/stock.service';
import * as fs from 'fs';

@Injectable()
export class ExportService {
  constructor(private stockService: StockService) {}

  async generateStockPDF(): Promise<Buffer> {
    const stockData = await this.stockService.stockToExport();
    console.log('stock data....', stockData);
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const logoPath = 'src/ExportPdf/logo.jpg';
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 470, 20, { width: 100 });
      }
      doc.moveDown();
      doc.moveDown();
      doc.moveDown();
      doc.moveDown();

      // Título del documento
      doc
        .fontSize(20)
        .text('Hansel & Gretel - Reporte de Stock', { align: 'center' });
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
          const name = isIngredient
            ? item.ingredient.name
            : (item.product.name ?? '');

          const cost = isIngredient
            ? `$${parseFloat(item.ingredient.cost).toFixed(1)}`
            : `$${parseFloat(item.product.cost).toFixed(1)}`;

          return [
            name ?? '',
            parseFloat(item.quantityInStock).toFixed(2),
            item.unitOfMeasure?.abbreviation ?? '',
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
        columnSpacing: 5,
        prepareHeader: () => {
          doc.font('Helvetica-Bold').fontSize(10);
          return doc;
        },
        prepareRow: (row, indexColumn, indexRow, rectRow) => {
          doc.font('Helvetica').fontSize(9);
          if (indexRow % 2 === 0) {
            doc.fillColor('#F9F9F9');
          } else {
            doc.fillColor('#FFFFFF');
          }
          doc.rect(rectRow.x, rectRow.y, rectRow.width, rectRow.height).fill();
          doc.fillColor('#000000');
          return doc;
        },
      };

      // Generar la tabla
      doc.table(tableData, tableOptions);
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(8)
          .fillColor('gray')
          .text(`Página ${i + 1} de ${range.count}`, 30, doc.page.height - 30, {
            align: 'right',
            width: doc.page.width - 60,
          });
      }
      doc.end();
    });
  }
}
