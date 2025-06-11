import { Controller, Get, Res } from '@nestjs/common';
import { ExportService } from './export.service';
import { Response } from 'express';

@Controller('export')
export class ExportController {
  constructor(private exportService: ExportService) {}

  @Get('stock/pdf')
  async exportStockPDF(@Res() res: Response) {
    const pdfBuffer = await this.exportService.generateStockPDF();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=stock_report.pdf',
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }
}
