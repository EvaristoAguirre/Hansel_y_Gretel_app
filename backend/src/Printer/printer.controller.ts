import { Controller, Post, Body } from '@nestjs/common';
import { PrinterService } from './printer.service';
import { PrintOptions } from './printer.interface';

@Controller('printer')
export class PrinterController {
  constructor(private readonly printerService: PrinterService) {}

  @Post('print')
  async printText(@Body() body: { text: string; options?: PrintOptions }) {
    return this.printerService.printText(body.text, body.options);
  }

  @Post('test')
  async testPrint() {
    return this.printerService.printTestPage();
  }
}