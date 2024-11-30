import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Product } from 'src/Product/product.entity';

export class UpdateProviderDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  phone?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  products?: Product[];
}
