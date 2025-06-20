import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { MethodOfPayment } from 'src/Enums/paymentMethod.enum';

export class CloseOrderDto {
  @IsNotEmpty()
  @IsNumber()
  total: number;

  @IsNotEmpty()
  @IsEnum(MethodOfPayment)
  methodOfPayment: MethodOfPayment;

  @IsOptional()
  @IsString()
  commandNumber?: string;
}
