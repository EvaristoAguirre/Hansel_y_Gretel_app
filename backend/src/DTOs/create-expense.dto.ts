import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { DailyCashMovementType, PaymentMethod } from 'src/Enums/dailyCash.enum';

export class RegisterExpenseDto {
  @IsNumber()
  amount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  dailyCashId: string;
}

export class RegisterMovementDto {
  @IsNumber()
  amount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  dailyCashId: string;

  @IsEnum(DailyCashMovementType)
  movementType: DailyCashMovementType;
}
