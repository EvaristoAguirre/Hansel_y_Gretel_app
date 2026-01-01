import { plainToInstance } from 'class-transformer';
import { Product } from './entities/product.entity';
import {
  ProductResponseDto,
  PromotionSlotResponseDto,
  PromotionSlotOptionResponseDto,
  UnitOfMeasureResponseDto,
} from 'src/DTOs/productResponse.dto';
import { PromotionResponse } from 'src/DTOs/promotionResponse.dto';
export class ProductMapper {
  static toResponseDto(product: Product): ProductResponseDto {
    const dto = plainToInstance(ProductResponseDto, product, {
      excludeExtraneousValues: true,
    });

    const formatter = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    const formatterStock = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    dto.price = formatter.format(Number(product.price));
    dto.cost = formatter.format(Number(product.cost));
    dto.baseCost = formatter.format(Number(product.baseCost ?? 0));

    if (product.stock) {
      dto.stock = {
        id: product.stock.id,
        quantityInStock: formatterStock.format(
          Number(product.stock.quantityInStock),
        ),
        minimumStock: formatterStock.format(Number(product.stock.minimumStock)),
        unitOfMeasure: plainToInstance(
          UnitOfMeasureResponseDto,
          product.stock.unitOfMeasure,
          {
            excludeExtraneousValues: true,
          },
        ),
      };
    }

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

    dto.promotionSlotAssignments =
      product.promotionSlotAssignments?.map((assignment) => {
        const slotDto = plainToInstance(
          PromotionSlotResponseDto,
          assignment.slot,
          {
            excludeExtraneousValues: true,
          },
        );

        // Mapear manualmente las opciones porque necesitan transformación del producto
        slotDto.options =
          assignment.slot.options?.map((option) => {
            const optionDto = plainToInstance(
              PromotionSlotOptionResponseDto,
              option,
              {
                excludeExtraneousValues: true,
              },
            );

            // Transformar el producto dentro de la opción
            if (option.product) {
              optionDto.product = this.toResponseDto(option.product);
            }

            return optionDto;
          }) ?? [];

        return {
          slot: slotDto,
          quantity: assignment.quantity,
          isOptional: assignment.isOptional,
        };
      }) ?? [];
    return dto;
  }

  static toResponseDtoArray(products: Product[]): ProductResponseDto[] {
    return products.map((product) => this.toResponseDto(product));
  }
}
