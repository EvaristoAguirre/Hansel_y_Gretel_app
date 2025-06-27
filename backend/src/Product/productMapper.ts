import { plainToInstance } from 'class-transformer';
import { Product } from './product.entity';
import {
  ProductResponseDto,
  UnitOfMeasureResponseDto,
} from 'src/DTOs/productResponse.dto';

export class ProductMapper {
  static toResponseDto(product: Product): ProductResponseDto {
    const dto = plainToInstance(ProductResponseDto, product, {
      excludeExtraneousValues: true,
    });

    dto.availableToppingGroups =
      product.availableToppingGroups?.map((group) => ({
        id: group.toppingGroup?.id ?? null,
        name: group.toppingGroup?.name || '',
        settings: group.settings,
        quantityOfTopping: group.quantityOfTopping,
        unitOfMeasure: plainToInstance(
          UnitOfMeasureResponseDto,
          group.unitOfMeasure ?? {},
          {
            excludeExtraneousValues: true,
          },
        ),
        toppings:
          group.toppingGroup?.toppings?.map((topping) => ({
            id: topping.id,
            name: topping.name,
          })) ?? [],
        toppingsGroup:
          group.toppingGroup.productsAvailableIn?.map((tg) => ({
            id: tg.id,
            name: tg.toppingGroup?.name ?? '',
            toppings:
              tg.toppingGroup?.toppings?.map((topping) => ({
                id: topping.id,
                name: topping.name,
              })) ?? [],
          })) ?? [],
      })) ?? [];

    return dto;
  }

  static toResponseDtoArray(products: Product[]): ProductResponseDto[] {
    return products.map(this.toResponseDto);
  }
}
