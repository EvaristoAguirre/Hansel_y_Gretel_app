import { Controller } from '@nestjs/common';
import { PrinterService } from './printer.service';

@Controller('printing')
export class PrinterController {
  constructor(private readonly printerService: PrinterService) {}
}
