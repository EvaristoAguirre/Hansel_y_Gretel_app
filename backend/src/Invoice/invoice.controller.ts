import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/Decorators/roles.decorator';
import { UserRole } from 'src/Enums/roles.enum';
import { RolesGuard } from 'src/Guards/roles.guard';
import { CreateManualInvoiceDto } from './create-manual-invoice.dto';
import { InvoiceDocumentService } from './invoice-document.service';
import { UpdateInvoiceEmailDto } from './invoice-email.dto';
import { InvoiceMailService } from './invoice-mail.service';
import { ArcaClient } from './arca-client';
import { compararAlicuotas } from './arca-wsfe-client';
import { InvoiceService } from './invoice.service';

@Controller('invoices')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.ENCARGADO)
export class InvoiceController {
  constructor(
    private readonly invoices: InvoiceService,
    private readonly documents: InvoiceDocumentService,
    private readonly mail: InvoiceMailService,
    private readonly arca: ArcaClient,
  ) {}

  @Get('arca/parametros')
  @Roles(UserRole.ADMIN)
  async parametros() {
    const [dummy, tiposIva, condiciones, puntosVenta] = await Promise.all([
      this.arca.dummy(),
      this.arca.getTiposIva(),
      this.arca.getCondicionIvaReceptor(),
      this.arca.getPtosVenta(),
    ]);
    return {
      dummy,
      tiposIva,
      condiciones,
      puntosVenta,
      alicuotas: compararAlicuotas(tiposIva),
      consumidorFinal: condiciones.filter((item) =>
        /consumidor final/i.test(item.desc),
      ),
    };
  }

  @Post()
  create(@Body() body: CreateManualInvoiceDto) {
    return this.invoices.emitManual(body);
  }

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

  @Patch(':id/email')
  updateEmail(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateInvoiceEmailDto,
  ) {
    return this.mail.updateEmail(id, body.customerEmail);
  }

  @Post(':id/send-email')
  sendEmail(@Param('id', ParseUUIDPipe) id: string) {
    return this.mail.send(id);
  }
}
