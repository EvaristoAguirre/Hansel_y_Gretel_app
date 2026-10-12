import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/Decorators/roles.decorator';
import { UserRole } from 'src/Enums/roles.enum';
import { RolesGuard } from 'src/Guards/roles.guard';
import { InvoiceService } from './invoice.service';

@Controller('invoices')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.ENCARGADO)
export class InvoiceController {
  constructor(private readonly invoices: InvoiceService) {}

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

  @Get(':id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoices.detail(id);
  }

  @Post(':id/retry')
  retry(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoices.retry(id);
  }
}
