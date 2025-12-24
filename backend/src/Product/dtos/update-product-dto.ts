import {
  IsOptional,
  IsInt,
  Max,
  Min,
  IsString,
  IsArray,
  IsUUID,
  IsNumber,
  IsBoolean,
  ValidateNested,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PromotionProductDto } from '../../DTOs/create-promotion.dto';
import { UpdatePromotionSlotWithOptionsDto } from './update-slot-option-for-update.dto';

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
  @IsNumber()
  @Min(0)
  baseCost?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categories?: string[];

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductIngredientDto)
  ingredients?: ProductIngredientDto[];

  @IsOptional()
  @IsEnum(['product', 'promotion', 'simple'])
  type?: 'product' | 'promotion' | 'simple';

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PromotionProductDto)
  products?: PromotionProductDto[];

  @IsOptional()
  @IsBoolean()
  allowsToppings?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductToppingsGroupDto)
  availableToppingGroups?: ProductToppingsGroupDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePromotionSlotWithOptionsDto)
  slots?: UpdatePromotionSlotWithOptionsDto[];
}

export class ProductIngredientDto {
  @IsNotEmpty()
  @IsString()
  ingredientId: string;

  @IsNotEmpty()
  @IsNumber()
  quantityOfIngredient: number;

  @IsNotEmpty()
  @IsString()
  unitOfMeasureId: string;
}

export class ProductToppingsGroupDto {
  @IsUUID()
  toppingsGroupId: string;

  @IsOptional()
  @IsNumber()
  quantityOfTopping: number;

  @IsOptional()
  @IsString()
  unitOfMeasureId?: string;

  @IsOptional()
  settings?: {
    maxSelection: number;
    chargeExtra: boolean;
    extraCost: number;
  };
}
