import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class ProductIngredientDto {
  @IsNotEmpty()
  @IsString()
  ingredientId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  quantityOfIngredient: number;

  @IsNotEmpty()
  @IsString()
  unitOfMeasureId: string;
}
