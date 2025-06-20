import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { DailyCashMovementType, PaymentMethod } from 'src/Enums/dailyCash.enum';

export class RegisterExpenseDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  dailyCashId: string;

  @IsEnum(DailyCashMovementType)
  movementType: DailyCashMovementType;

  @IsArray()
  @IsNotEmpty()
  payments: PaymentsDto[];
}

export class RegisterMovementDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  dailyCashId: string;

  @IsEnum(DailyCashMovementType)
  movementType: DailyCashMovementType;

  @IsArray()
  @IsNotEmpty()
  payments: PaymentsDto[];
}

export class PaymentsDto {
  @IsNumber()
  amount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
