import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateSlotOptionForCreationDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsBoolean()
  @IsNotEmpty()
  isDefault: boolean;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  extraCost: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  displayOrder: number;
}

export class CreatePromotionSlotWithOptionsDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  displayOrder: number;

  @IsBoolean()
  @IsNotEmpty()
  isOptional: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSlotOptionForCreationDto)
  @ArrayMaxSize(10, { message: 'Un slot no puede tener más de 10 opciones' })
  options: CreateSlotOptionForCreationDto[];
}
