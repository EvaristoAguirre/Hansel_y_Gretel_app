import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from 'src/Enums/paymentMethod.enum';

export class CloseOrderDto {
  @IsNotEmpty()
  @IsNumber()
  total: number;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDetailDto)
  payments: PaymentDetailDto[];

  @IsOptional()
  @IsString()
  commandNumber?: string;

  /** Solo aplica en flujo de pago total; 0 en pago parcial. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  /** Si es true, después del cobro se pide una Factura B. Default false. */
  @IsOptional()
  @IsBoolean()
  invoice?: boolean;

  /** Se guarda en la factura solo cuando invoice es true. */
  @IsOptional()
  @IsEmail()
  customerEmail?: string;
}

export class PaymentDetailDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  methodOfPayment: PaymentMethod;
}
