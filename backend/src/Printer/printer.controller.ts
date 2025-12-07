// printer/printer.controller.ts
import { Body, Controller, Param, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PrinterService } from './printer.service';
import { PrintComandaDTO } from 'src/DTOs/print-comanda.dto';

@ApiTags('Impresora')
@ApiBearerAuth('JWT-auth')
@Controller('printer')
export class PrinterController {
  constructor(private readonly printerService: PrinterService) {}

  @Post('printTicket')
  @ApiOperation({
    summary: 'Imprimir ticket de venta',
    description:
      'Imprime el ticket/factura de un pedido para entregar al cliente',
  })
  @ApiBody({
    description: 'Datos del pedido a imprimir',
    schema: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'UUID del pedido' },
        tableName: { type: 'string', description: 'Nombre de la mesa' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              quantity: { type: 'number' },
              price: { type: 'number' },
            },
          },
        },
        total: { type: 'number', description: 'Total a pagar' },
        paymentMethod: { type: 'string', description: 'Método de pago' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Ticket enviado a imprimir' })
  @ApiResponse({ status: 500, description: 'Error de impresión' })
  async printSampleTicket(@Body() orderData) {
    return await this.printerService.printTicketOrder(orderData);
  }

  @Post('printTicket/:id')
  @ApiOperation({
    summary: 'Reimprimir ticket de venta',
    description: 'Reimprime el ticket de un pedido específico por su ID',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del pedido a reimprimir',
  })
  @ApiBody({ description: 'Datos adicionales del pedido (opcional)' })
  @ApiResponse({ status: 200, description: 'Ticket reenviado a imprimir' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  async rePrintSampleTicket(@Param('id') id: string, @Body() orderData) {
    return await this.printerService.printTicketOrder(orderData);
  }

  @Post('printComanda')
  @ApiOperation({
    summary: 'Imprimir comanda de cocina',
    description: 'Imprime la comanda con los productos para la cocina/barra',
  })
  @ApiBody({
    type: PrintComandaDTO,
    description: 'Datos de la comanda',
    examples: {
      ejemplo: {
        value: {
          tableName: 'Mesa 5',
          items: [
            { name: 'Café con leche', quantity: 2, notes: 'Sin azúcar' },
            { name: 'Medialunas', quantity: 4, notes: '' },
          ],
          timestamp: '2024-01-15T10:30:00Z',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Comanda enviada a imprimir' })
  @ApiResponse({ status: 500, description: 'Error de impresión' })
  async printKitchenOrder(@Body() orderData: PrintComandaDTO): Promise<string> {
    return this.printerService.printKitchenOrder(orderData);
  }
}
