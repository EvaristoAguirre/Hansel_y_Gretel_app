import { IsInt, IsString, IsUUID, Min } from 'class-validator';

export class CheckStockDto {
  @IsString() // Primero verifica que sea string
  @IsUUID() // Luego que sea UUID
  productId: string;

  @IsInt()
  @Min(0)
  quantityToSell: number;
}
