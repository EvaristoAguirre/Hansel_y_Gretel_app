import { Controller, Get, Res } from '@nestjs/common';
import { ExportService } from './export.service';
import { StockService } from '../stock/stock.service';
import { Response } from 'express';

@Controller('export')
export class ExportController {
  constructor(
    private exportService: ExportService,
    private stockService: StockService,
  ) {}

  @Get('stock/pdf')
  async exportStockPDF(@Res() res: Response) {
    const stockData = await this.stockService.stockToExport(); // Obtiene datos del servicio de stock
    const pdfBuffer = await this.exportService.generateStockPDF(stockData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=stock_report.pdf',
    );
    res.send(pdfBuffer);
  }
}
