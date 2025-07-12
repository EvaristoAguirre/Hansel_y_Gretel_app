import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit-table';
import * as fs from 'fs';
import { ProductService } from 'src/Product/product.service';
import { IngredientService } from 'src/Ingredient/ingredient.service';
import { Product } from 'src/Product/product.entity';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { ProductsToExportDto } from 'src/DTOs/productsToExport.dto';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import table from 'pdfkit-table';

@Injectable()
export class ExportService {
  constructor(
    private productService: ProductService,
    private ingredientService: IngredientService,
  ) {}

  async generateStockPDF(): Promise<Buffer> {
    const stockData = await this.getStockToExport();

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
      doc.moveDown(3);

      // Título del documento
      doc.fontSize(15).text('Reporte de Stock', { align: 'center' });
      doc.moveDown();

      const tableData = {
        headers: [
          { label: 'Nombre', property: 'name', width: 190 },
          {
            label: 'Cant. actual',
            property: 'quantity',
            width: 60,
            align: 'right',
          },
          { label: 'Unidad', property: 'unit', width: 50, align: 'center' },
          {
            label: 'Costo',
            property: 'cost',
            width: 60,
            align: 'right',
          },
          {
            label: 'Cant. comprada',
            property: 'bought',
            width: 75,
            align: 'center',
          },
          {
            label: 'Precio pagado',
            property: 'paid',
            width: 65,
            align: 'right',
          },
        ],
        datas: stockData.map((item) => ({
          name: item.name,
          quantity: this.formatNumber(item.quantityInStock),
          unit: item.unitOfMeasure,
          cost: this.formatNumber(item.cost),
          bought: '',
          paid: '',
        })),
      };

      (doc as any).table(tableData, {
        divider: {
          header: { disabled: false, width: 1 },
          horizontal: { disabled: false, width: 0.5 },
        },
      });

      doc.end();
    });
  }

  async exportStockAndPrint() {
    try {
      const stockData = await this.getStockToExport();
      const now = new Date();

      const dateFormatted = now.toLocaleDateString('es-Ar');
      const commands = [
        '\x1B\x40', // Inicializar impresora
        '\x1B\x74\x02', // Codificación Windows-1252
        '\x1B\x61\x01', // Centrar
        '\x1D\x21\x01', // Tamaño de texto mediano
        '=== STOCK ===\n',
        '\x1D\x21\x00', // Tamaño de texto normal
        `Fecha: ${dateFormatted}\n`,
        '----------------------------------------\n',
        '\x1B\x61\x00', // Alinear izquierda
        ...stockData.flatMap((item) => {
          const name = this.normalizeText(item.name.toUpperCase()).substring(
            0,
            40,
          );
          const quantity = this.formatNumber(item.quantityInStock);
          const unit = item.unitOfMeasure;
          const cost = `$ ${this.formatNumber(item.cost)}`;
          const lines: string[] = [];

          lines.push('\x1B\x45\x01'); // Negrita ON
          lines.push(`${name}`);
          lines.push('\x1B\x45\x00'); // Negrita OFF
          lines.push(`Cantidad: ${quantity} ${unit}`);
          lines.push(`Costo:    ${cost}`);
          lines.push(''); // Espacio entre productos

          return lines;
        }),
        '----------------------------------------\n',
        '\x1B\x42\x01\x02', // Pitido
        '\x1D\x56\x41\x30', // Cortar papel
      ].join('\n');

      const printSuccess = await this.sendRawCommand(commands);

      if (!printSuccess) {
        throw new Error('Print command failed');
      }

      return 'Reporte de stock impreso correctamente.';
    } catch (error) {
      this.logger.error(
        `Error al imprimir reporte de stock: ${error.message}`,
        error.stack,
      );
      throw new Error(`Error al imprimir: ${error.message}`);
    }
  }

  async getStockToExport() {
    const products = await this.productService.getProductsWithStock();
    const ingredients = await this.ingredientService.getIngredientsWithStock();

    return [...products, ...ingredients].map(this.adaptExportDto);
  }

  private adaptExportDto(item: Product | Ingredient): ProductsToExportDto {
    return {
      name: item.name,
      quantityInStock: item.stock?.quantityInStock ?? 0,
      unitOfMeasure: item.stock?.unitOfMeasure?.abbreviation ?? 'N/D',
      cost: item.cost ?? 0,
    };
  }

  private formatNumber(value: number | null | undefined): string {
    return (value ?? 0).toLocaleString('es-AR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    });
  }
}
