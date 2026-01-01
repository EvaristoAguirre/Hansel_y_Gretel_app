import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Product } from 'src/Product/entities/product.entity';
import { Entity } from 'typeorm';

@Entity()
export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  products?: Product[];
}
