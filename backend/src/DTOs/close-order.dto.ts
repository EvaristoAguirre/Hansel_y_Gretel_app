import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { MethodOfPayment } from 'src/Enums/methodOfPayment.enum';

export class CloseOrderDto {
  @IsNotEmpty()
  @IsNumber()
  total: number;

  @IsNotEmpty()
  @IsEnum({ enum: MethodOfPayment })
  methodOfPayment: MethodOfPayment;

  @IsOptional()
  @IsString()
  commandNumber?: string;
}
