import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/Decorators/roles.decorator';
import { UserRole } from 'src/Enums/roles.enum';
import { RolesGuard } from 'src/Guards/roles.guard';
import { InvoiceDocumentService } from './invoice-document.service';
import { InvoiceService } from './invoice.service';

@Controller('invoices')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.ENCARGADO)
export class InvoiceController {
  constructor(
    private readonly invoices: InvoiceService,
    private readonly documents: InvoiceDocumentService,
  ) {}

  @Get()
  list(@Query('month') month?: string, @Query('year') year?: string) {
    const now = new Date();
    const parsedMonth = month ? Number(month) : now.getMonth() + 1;
    const parsedYear = year ? Number(year) : now.getFullYear();
    if (
      !Number.isInteger(parsedMonth) ||
      parsedMonth < 1 ||
      parsedMonth > 12 ||
      !Number.isInteger(parsedYear)
    ) {
      throw new BadRequestException('Mes o año inválido.');
    }
    return this.invoices.list(parsedMonth, parsedYear);
  }

  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  async pdf(@Param('id', ParseUUIDPipe) id: string): Promise<StreamableFile> {
    const buffer = await this.documents.pdf(id);
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: 'attachment; filename="factura-b.pdf"',
    });
  }

  @Get(':id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoices.detail(id);
  }

  @Post(':id/print')
  print(@Param('id', ParseUUIDPipe) id: string) {
    return this.documents.print(id);
  }

  @Post(':id/retry')
  retry(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoices.retry(id);
  }
}
