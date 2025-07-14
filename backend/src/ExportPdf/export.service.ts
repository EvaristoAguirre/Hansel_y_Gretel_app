import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit-table';
import * as fs from 'fs';
import { ProductService } from 'src/Product/product.service';
import { IngredientService } from 'src/Ingredient/ingredient.service';
import { Product } from 'src/Product/product.entity';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { ProductsToExportDto } from 'src/DTOs/productsToExport.dto';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import table from 'pdfkit-table';
import { PrinterService } from 'src/Printer/printer.service';

@Injectable()
export class ExportService {
  readonly logger = new Logger(ExportService.name);
  constructor(
    private productService: ProductService,
    private ingredientService: IngredientService,
    private printerService: PrinterService,
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
      await this.printerService.printerStock(stockData);
    } catch (error) {
      this.logger.warn('Fallo la impresión, no se exportó el stock.');
      throw error;
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
