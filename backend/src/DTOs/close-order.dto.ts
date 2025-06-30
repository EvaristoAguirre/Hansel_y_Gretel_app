import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaymentMethod } from 'src/Enums/paymentMethod.enum';

export class CloseOrderDto {
  @IsNotEmpty()
  @IsNumber()
  total: number;

  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  methodOfPayment: PaymentMethod;

  @IsOptional()
  @IsString()
  commandNumber?: string;
}
