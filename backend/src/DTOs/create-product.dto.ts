import {
  IsInt,
  Max,
  Min,
  IsOptional,
  IsString,
  IsArray,
  ArrayNotEmpty,
  IsUUID,
} from 'class-validator';

export class CreateProductDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  code?: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  price?: number;

  @IsOptional()
  cost?: number;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  categories?: string[];

  @IsOptional()
  @IsString()
  providerId?: string;
}
