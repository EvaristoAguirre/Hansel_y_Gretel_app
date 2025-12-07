import { Controller, Get, Res } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiProduces,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ExportService } from './export.service';
import { Response } from 'express';

@ApiTags('Exportar')
@ApiBearerAuth('JWT-auth')
@Controller('export')
export class ExportController {
  constructor(private exportService: ExportService) {}

  @Get('stock/pdf')
  @ApiOperation({
    summary: 'Exportar stock a PDF',
    description:
      'Genera y descarga un reporte PDF con el estado actual del inventario',
  })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'PDF generado exitosamente',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Error al generar el PDF' })
  async exportStockPDF(@Res() res: Response) {
    const pdfBuffer = await this.exportService.generateStockPDF();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=stock_report.pdf',
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  @Get('stock/printer')
  @ApiOperation({
    summary: 'Imprimir reporte de stock',
    description:
      'Genera e imprime directamente el reporte de stock en la impresora configurada',
  })
  @ApiResponse({ status: 200, description: 'Reporte enviado a imprimir' })
  @ApiResponse({ status: 500, description: 'Error al imprimir' })
  async exportStockAndPrint() {
    await this.exportService.exportStockAndPrint();
  }
}
