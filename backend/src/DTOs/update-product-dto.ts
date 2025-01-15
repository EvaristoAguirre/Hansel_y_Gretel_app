import {
  IsOptional,
  IsInt,
  Max,
  Min,
  IsString,
  IsArray,
  IsUUID,
  IsNumber,
} from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  code?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoriesIds?: string[];

  @IsOptional()
  @IsString()
  providerId?: string;
}
