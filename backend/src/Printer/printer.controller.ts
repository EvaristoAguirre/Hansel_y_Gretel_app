import { Controller, Post } from '@nestjs/common';
import { PrinterService } from './printer.service';

@Controller('printer')
export class PrinterController {
  constructor(private readonly printerService: PrinterService) {}

  @Post('test')
  async isConnect() {
    return await this.printerService.isConnect();
  }

  @Post('printTest')
  async printText() {
    return await this.printerService.printTest();
  }
  @Post('printTest2')
  async printText2() {
    return await this.printerService.printTest();
  }
  @Post('printTest3')
  async printText3() {
    return await this.printerService.printTest3();
  }

  @Post('printRawTest')
  async printRawTest() {
    return await this.printerService.printRawTest();
  }
}
