import { plainToInstance } from 'class-transformer';
import { Product } from './product.entity';
import {
  ProductResponseDto,
  // ToppingGroupResponseDto,
  UnitOfMeasureResponseDto,
} from 'src/DTOs/productResponse.dto';
import { PromotionResponse } from 'src/DTOs/promotionResponse.dto';

// export class ProductMapper {
//   static toResponseDto(product: Product): ProductResponseDto {
//     const dto = plainToInstance(ProductResponseDto, product, {
//       excludeExtraneousValues: true,
//     });

//     dto.availableToppingGroups =
//       product.availableToppingGroups?.map((group) => ({
//         settings: group.settings,
//         quantityOfTopping: group.quantityOfTopping,
//         unitOfMeasure: plainToInstance(
//           UnitOfMeasureResponseDto,
//           group.unitOfMeasure ?? {},
//           {
//             excludeExtraneousValues: true,
//           },
//         ),
//         toppingsGroup: plainToInstance(
//           ToppingGroupResponseDto,
//           {
//             id: group.toppingGroup?.id,
//             name: group.toppingGroup?.name,
//             toppings: group.toppingGroup?.toppings ?? [],
//           },
//           { excludeExtraneousValues: true },
//         ),
//       })) ?? [];

//     dto.promotionDetails =
//       product.promotionDetails?.map((detail) => ({
//         id: detail.id,
//         quantity: detail.quantity,
//         product: this.toResponseDto(detail.product),
//         promotion: plainToInstance(PromotionResponse, {
//           id: product.id,
//           name: product.name,
//         }),
//       })) ?? [];
//     return dto;
//   }

//   static toResponseDtoArray(products: Product[]): ProductResponseDto[] {
//     return products.map((product) => this.toResponseDto(product));
//   }
// }
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
      })) ?? [];

    dto.promotionDetails =
      product.promotionDetails?.map((detail) => ({
        id: detail.id,
        quantity: detail.quantity,
        product: this.toResponseDto(detail.product),
        promotion: plainToInstance(PromotionResponse, {
          id: product.id,
          name: product.name,
        }),
      })) ?? [];
    return dto;
  }

  static toResponseDtoArray(products: Product[]): ProductResponseDto[] {
    return products.map((product) => this.toResponseDto(product));
  }
}
