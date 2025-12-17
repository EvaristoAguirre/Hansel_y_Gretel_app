import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreatePromotionSlotDto {
  @IsUUID()
  @IsNotEmpty()
  promotionId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  displayOrder: number;

  @IsBoolean()
  @IsNotEmpty()
  isOptional: boolean;
}
