// printer/printer.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { PrinterService } from './printer.service';
import { PrintComandaDTO } from 'src/DTOs/print-comanda.dto';

@Controller('printer')
export class PrinterController {
  constructor(private readonly printerService: PrinterService) {}

  // @Post('print-sample')
  // async printSampleTicket() {
  //   return await this.printerService.printSampleTicket();
  // }

  @Post('printComanda')
  async printKitchenOrder(@Body() orderData: PrintComandaDTO): Promise<void> {
    return this.printerService.printKitchenOrder(orderData);
  }
}
