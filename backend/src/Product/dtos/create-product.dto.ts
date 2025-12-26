import {
  IsInt,
  Max,
  Min,
  IsOptional,
  IsString,
  IsArray,
  IsUUID,
  IsNumber,
  IsNotEmpty,
  ValidateNested,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductIngredientDto } from '../../DTOs/productIngredient.dto';
import { Transform, Type } from 'class-transformer';
import { PromotionProductDto } from '../../DTOs/create-promotion.dto';
import { CreatePromotionSlotWithOptionsDto } from './create-slot-option-for-creation.dto';

export class ProductToppingsGroupDto {
  @ApiProperty({
    description: 'UUID del grupo de toppings',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  toppingsGroupId: string;

  @ApiPropertyOptional({
    description: 'Cantidad de topping incluida',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  quantityOfTopping: number;

  @ApiPropertyOptional({
    description: 'UUID de la unidad de medida para el topping',
    example: 'uuid-unidad-medida',
  })
  @IsOptional()
  @IsString()
  unitOfMeasureId?: string;

  @ApiPropertyOptional({
    description: 'Configuración del grupo de toppings para este producto',
    example: { maxSelection: 3, chargeExtra: true, extraCost: 200 },
  })
  @IsOptional()
  settings?: {
    maxSelection: number;
    chargeExtra: boolean;
    extraCost: number;
  };
}

export class CreateProductDto {
  @ApiProperty({
    description: 'Nombre del producto (se guarda en minúsculas)',
    example: 'Café Americano',
  })
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  @IsString()
  @Transform(({ value }) => value.toLowerCase())
  name: string;

  @ApiPropertyOptional({
    description: 'Código único del producto (0-9999)',
    example: 101,
    minimum: 0,
    maximum: 9999,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  code?: number;

  @ApiPropertyOptional({
    description: 'Descripción del producto',
    example: 'Café negro tradicional, ideal para comenzar el día',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Precio de venta al público',
    example: 1500,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    description: 'Costo del producto (para cálculo de ganancia)',
    example: 300,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({
    description: 'Costo base del producto',
    example: 250,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseCost?: number;

  @ApiPropertyOptional({
    description: 'UUIDs de las categorías a las que pertenece',
    type: [String],
    example: ['uuid-bebidas', 'uuid-cafeteria'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  categories?: string[];

  @ApiPropertyOptional({
    description: 'Ingredientes que componen el producto',
    type: [ProductIngredientDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductIngredientDto)
  ingredients?: ProductIngredientDto[];

  @ApiPropertyOptional({
    description: 'Tipo de producto',
    enum: ['product', 'promotion'],
    example: 'product',
  })
  @IsOptional()
  @IsEnum(['product', 'promotion'])
  type?: 'product' | 'promotion';

  @ApiPropertyOptional({
    description: 'Productos incluidos (solo para promociones)',
    type: [PromotionProductDto],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PromotionProductDto)
  products?: PromotionProductDto[];

  @ApiPropertyOptional({
    description: 'Indica si el producto permite agregar toppings',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  allowsToppings?: boolean;

  @ApiPropertyOptional({
    description: 'Grupos de toppings disponibles para el producto',
    type: [ProductToppingsGroupDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductToppingsGroupDto)
  availableToppingGroups?: ProductToppingsGroupDto[];

  // @ApiPropertyOptional({
  //   description: 'Configuración del grupo de toppings para este producto',
  //   example: { maxSelection: 3, chargeExtra: true, extraCost: 200 },
  // })
  // @IsOptional()
  // toppingsSettings?: {
  //   maxSelection: number;
  //   chargeExtra: boolean;
  //   extraCost: number;
  // };

  @ApiPropertyOptional({
    description: 'Indica si el producto está activo',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePromotionSlotWithOptionsDto)
  slots?: CreatePromotionSlotWithOptionsDto[];
}
