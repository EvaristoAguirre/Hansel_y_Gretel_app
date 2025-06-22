import { PartialType } from '@nestjs/swagger';
import { CreateDailyCashDto } from './create-daily-cash.dto';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateDailyCashDto extends PartialType(CreateDailyCashDto) {
  @IsString()
  @IsOptional()
  comment: string;

  @IsOptional()
  date: Date;

  @IsOptional()
  @IsNumber()
  totalSales: number;

  @IsOptional()
  @IsNumber()
  totalExpenses: number;

  @IsOptional()
  @IsNumber()
  newExpense: number;

  @IsOptional()
  @IsNumber()
  totalPayments: number;

  @IsNumber()
  @IsOptional()
  totalCash: number;

  @IsOptional()
  @IsNumber()
  totalCreditCard: number;

  @IsOptional()
  @IsNumber()
  totalDebitCard: number;

  @IsOptional()
  @IsNumber()
  totalTransfer: number;

  @IsOptional()
  @IsNumber()
  totalMercadoPago: number;

  @IsOptional()
  @IsNumber()
  totalOtherPayments: number;

  @IsOptional()
  @IsArray()
  ordersIds: string[];
}
