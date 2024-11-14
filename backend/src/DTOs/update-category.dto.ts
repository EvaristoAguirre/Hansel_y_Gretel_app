import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Product } from 'src/Product/product.entity';
import { Entity } from 'typeorm';

@Entity()
export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  products?: Product[];
}
