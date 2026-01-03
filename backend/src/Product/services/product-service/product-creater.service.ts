import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ProductResponseDto } from 'src/DTOs/productResponse.dto';
import { CreateProductDto } from 'src/Product/dtos/create-product.dto';
import { CreatePromotionWithSlotsDto } from 'src/Product/dtos/create-promotion-with-slots.dto';
import { Product } from 'src/Product/entities/product.entity';
import { PromotionSlotAssignment } from 'src/Product/entities/promotion-slot-assignment.entity';
import { PromotionSlot } from 'src/Product/entities/promotion-slot.entity';
import { ProductRepository } from 'src/Product/repositories/product.repository';
import { DataSource } from 'typeorm';

@Injectable()
export class ProductCreaterService {
  private readonly logger = new Logger(ProductCreaterService.name);
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly dataSource: DataSource,
  ) {}

  // ------- rta en string sin decimales y punto de mil
  async createProduct(data: CreateProductDto): Promise<ProductResponseDto> {
    try {
      const productCreated = await this.productRepository.createProduct(data);

      return productCreated;
    } catch (error) {
      this.logger.error('createProduct/Promotion', error);
      throw error;
    }
  }

  async createPromotionWithSlots(data: CreatePromotionWithSlotsDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    let isTransactionActive = false;

    try {
      await queryRunner.startTransaction();
      isTransactionActive = true;

      // Validar que se hayan proporcionado slots
      if (!data.slots || data.slots.length === 0) {
        throw new BadRequestException(
          'Debe proporcionar al menos un slot para la promoción',
        );
      }

      // 1. Crear el producto (promoción) con type='promotion'
      // Excluir el campo 'slots' ya que se maneja por separado mediante asignaciones
      const { slots: slotIds, ...productDataWithoutSlots } = data;
      const productData: CreateProductDto = {
        ...productDataWithoutSlots,
        type: data.type || 'promotion',
      };
      const product = await this.productRepository.createProductInTransaction(
        productData,
        queryRunner,
      );

      // 2. Validar y procesar cada slot
      let totalCost = 0;

      for (const slotId of slotIds) {
        // 2.1. Verificar existencia del slot y cargar con sus opciones
        const slot = await queryRunner.manager.findOne(PromotionSlot, {
          where: { id: slotId, isActive: true },
          relations: ['options', 'options.product'],
        });

        if (!slot) {
          throw new NotFoundException(
            `Slot con ID "${slotId}" no encontrado o inactivo`,
          );
        }

        // 2.2. Verificar que el slot tenga al menos una opción con producto
        if (!slot.options || slot.options.length === 0) {
          throw new BadRequestException(
            `El slot "${slot.name}" (${slotId}) no tiene productos asignados. Debe tener al menos una opción con producto.`,
          );
        }

        // Filtrar solo opciones activas con productos válidos
        const activeOptions = slot.options.filter(
          (option) => option.isActive && option.product,
        );

        if (activeOptions.length === 0) {
          throw new BadRequestException(
            `El slot "${slot.name}" (${slotId}) no tiene opciones activas con productos válidos.`,
          );
        }

        // 2.3. Calcular el costo promedio del slot
        // Si un slot tiene más de un producto, el costo será el promedio de los costos
        const slotCosts: number[] = [];

        for (const option of activeOptions) {
          const optionCost = parseFloat(String(option.product.cost || 0));
          // Sumar el extraCost de la opción si existe
          const extraCost = parseFloat(String(option.extraCost || 0));
          slotCosts.push(optionCost + extraCost);
        }

        // Calcular promedio del slot
        const slotAverageCost =
          slotCosts.reduce((sum, cost) => sum + cost, 0) / slotCosts.length;

        // Sumar al costo total de la promoción
        totalCost += slotAverageCost;

        // 2.4. Crear la asignación del slot a la promoción
        const slotAssignment = queryRunner.manager.create(
          PromotionSlotAssignment,
          {
            promotion: product,
            promotionId: product.id,
            slot: slot,
            slotId: slot.id,
            quantity: 1, // Por defecto cantidad 1, puede ajustarse si es necesario
            isOptional: false, // Por defecto no opcional, puede ajustarse si es necesario
          },
        );

        await queryRunner.manager.save(PromotionSlotAssignment, slotAssignment);
      }

      // 3. Actualizar el costo total de la promoción
      // NOTA: Otros atributos de Product como baseCost, toppingsCost pueden ajustarse posteriormente
      // según los requisitos del negocio. Por ahora se calcula el costo en función de los slots.
      product.cost = totalCost;
      // baseCost y toppingsCost quedan en sus valores por defecto (0 o null)
      await queryRunner.manager.save(Product, product);

      // 4. Commit de la transacción
      await queryRunner.commitTransaction();
      isTransactionActive = false;

      // 5. Recargar producto con todas las relaciones
      const productWithSlots =
        await this.productRepository.getProductWithRelationsByQueryRunner(
          product.id,
          'promotion',
        );

      return productWithSlots;
    } catch (error) {
      if (isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }

      this.logger.error('createPromotionWithSlots', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
