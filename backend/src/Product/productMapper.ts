import { plainToInstance } from 'class-transformer';
import { Product } from './product.entity';
import {
  ProductResponseDto,
  UnitOfMeasureResponseDto,
} from 'src/DTOs/productResponse.dto';

export class ProductMapper {
  static toResponseDto(product: Product): ProductResponseDto {
    console.log('Mapping product to response DTO:', product);

    const dto = plainToInstance(ProductResponseDto, product, {
      excludeExtraneousValues: true,
    });

    dto.availableToppingGroups = product.availableToppingGroups?.map(
      (group) => ({
        id: group.toppingGroup.id,
        name: group.toppingGroup.name,
        isActive: group.toppingGroup.isActive,
        settings: group.settings,
        toppings: group.toppingGroup.toppings?.map((topping) => ({
          id: topping.id,
          name: topping.name,
          unitOfMeasure: plainToInstance(
            UnitOfMeasureResponseDto,
            topping.unitOfMeasure,
            {
              excludeExtraneousValues: true,
            },
          ),
        })),
        toppingsGroup: group.toppingGroup.productsAvailableIn?.map((tg) => ({
          id: tg.id,
          name: tg.toppingGroup.name,
          toppings: tg.toppingGroup.toppings?.map((topping) => ({
            id: topping.id,
            name: topping.name,
            unitOfMeasure: plainToInstance(
              UnitOfMeasureResponseDto,
              topping.unitOfMeasure,
              {
                excludeExtraneousValues: true,
              },
            ),
          })),
        })),
      }),
    );

    return dto;
  }

  static toResponseDtoArray(products: Product[]): ProductResponseDto[] {
    return products.map(this.toResponseDto);
  }
}
