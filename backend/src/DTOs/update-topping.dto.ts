import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class UpdateToppingDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;

  @IsString()
  @IsOptional()
  type?: 'masa' | 'volumen' | 'unidad';

  @IsNumber()
  @Min(0)
  @IsOptional()
  extraCost?: number;

  @IsUUID()
  @IsOptional()
  unitOfMeasureId?: string;
}
