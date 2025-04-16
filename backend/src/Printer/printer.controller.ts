// printer/printer.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { PrinterService } from './printer.service';
import { PrintComandaDTO } from 'src/DTOs/print-comanda.dto';

@Controller('printer')
export class PrinterController {
  constructor(private readonly printerService: PrinterService) {}

  @Post('printTicket')
  async printSampleTicket(@Body() orderData) {
    return await this.printerService.printTicketOrder(orderData);
  }

  @Post('printComanda')
  async printKitchenOrder(@Body() orderData: PrintComandaDTO): Promise<string> {
    return this.printerService.printKitchenOrder(orderData);
  }
}
