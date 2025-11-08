import { ToppingsGroup } from './toppings-group.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ILike, Repository } from 'typeorm';
// import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { IngredientService } from 'src/Ingredient/ingredient.service';
import { CreateToppingsGroupDto } from 'src/DTOs/create-toppings-group.dto';
import { UpdateToppingsGroupDto } from 'src/DTOs/update-toppings-group.dto';
import { LoggerService } from 'src/Monitoring/monitoring-logger.service';

@Injectable()
export class ToppingsGroupRepository {
  constructor(
    @InjectRepository(ToppingsGroup)
    private readonly toppingsGroupRepository: Repository<ToppingsGroup>,
    private readonly ingredientService: IngredientService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * Método auxiliar para loguear errores con información estructurada
   * Centraliza el formato de logs para este repositorio
   */
  private logError(
    operation: string,
    context: Record<string, any>,
    error: any,
  ) {
    const errorInfo = {
      operation,
      repository: 'ToppingsGroupRepository',
      context,
      timestamp: new Date().toISOString(),
    };
    this.loggerService.error(errorInfo, error);
  }

  async createToppingsGroup(
    createToppingsGroupDto: CreateToppingsGroupDto,
  ): Promise<ToppingsGroup> {
    const { name, toppingsIds } = createToppingsGroupDto;

    const existingGroup = await this.toppingsGroupRepository.findOne({
      where: { name, isActive: true },
    });
    if (existingGroup) {
      throw new ConflictException(
        `Toppings group with name "${name}" already exists`,
      );
    }

    if (!name) throw new BadRequestException('Name is required');
    if (!toppingsIds?.length)
      throw new BadRequestException('At least one topping is required');

    try {
      const toppingsGroup = new ToppingsGroup();
      toppingsGroup.name = name;
      toppingsGroup.toppings = [];

      for (const toppingId of toppingsIds) {
        const topping = await this.ingredientService.findToppingById(toppingId);
        if (!topping)
          throw new NotFoundException(`Topping with ID ${toppingId} not found`);
        toppingsGroup.toppings.push(topping);
      }

      await this.toppingsGroupRepository.save(toppingsGroup);

      const savedGroup = await this.toppingsGroupRepository.findOne({
        where: { id: toppingsGroup.id },
        relations: ['toppings'],
      });

      if (!savedGroup)
        throw new InternalServerErrorException('Failed to load created group');
      return savedGroup;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logError('createToppingsGroup', { name, toppingsIds }, error);
      throw error;
    }
  }

  async updateToppingsGroup(
    id: string,
    updateToppingsGroupDto: UpdateToppingsGroupDto,
  ): Promise<ToppingsGroup> {
    if (!id) throw new BadRequestException('ID is required');

    const { name, toppingsIds } = updateToppingsGroupDto;

    if (!name && !toppingsIds) {
      throw new BadRequestException(
        'At least one field (name or toppingsIds) is required',
      );
    }

    try {
      const existingGroup = await this.toppingsGroupRepository.findOne({
        where: { id, isActive: true },
        relations: ['toppings'],
      });

      if (!existingGroup) {
        throw new NotFoundException(`Toppings group with ID ${id} not found`);
      }

      if (name && name !== existingGroup.name) {
        const nameConflict = await this.toppingsGroupRepository.findOne({
          where: { name, isActive: true },
        });
        if (nameConflict) {
          throw new ConflictException(
            `Toppings group with name "${name}" already exists`,
          );
        }
        existingGroup.name = name;
      }

      if (toppingsIds) {
        existingGroup.toppings = [];

        for (const toppingId of toppingsIds) {
          const topping =
            await this.ingredientService.findToppingById(toppingId);
          if (!topping) {
            throw new NotFoundException(
              `Topping with ID ${toppingId} not found`,
            );
          }
          existingGroup.toppings.push(topping);
        }
      }

      await this.toppingsGroupRepository.save(existingGroup);

      const updatedGroup = await this.toppingsGroupRepository.findOne({
        where: { id },
        relations: ['toppings'],
      });

      if (!updatedGroup)
        throw new InternalServerErrorException('Failed to load updated group');
      return updatedGroup;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logError('updateToppingsGroup', { id, updateToppingsGroupDto }, error);
      throw error;
    }
  }

  async getToppingsGroupById(id: string): Promise<ToppingsGroup | null> {
    if (!id) {
      throw new BadRequestException('ID is required to fetch toppings group');
    }
    try {
      const toppingsGroup = await this.toppingsGroupRepository.findOne({
        where: { id, isActive: true },
        relations: ['toppings'],
      });
      if (!toppingsGroup) {
        throw new NotFoundException(`toppings group with ID ${id} not found`);
      }
      return toppingsGroup;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logError('getToppingsGroupById', { id }, error);
      throw error;
    }
  }

  async getAllToppingsGroups(
    page: number = 1,
    limit: number = 100,
  ): Promise<ToppingsGroup[]> {
    if (page < 1 || limit < 1) {
      throw new BadRequestException('Page and limit must be greater than 0');
    }
    try {
      return await this.toppingsGroupRepository.find({
        where: { isActive: true },
        skip: (page - 1) * limit,
        take: limit,
        relations: ['toppings'],
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logError('getAllToppingsGroups', { page, limit }, error);
      throw error;
    }
  }
  async getAllToppingsGroupsWithoutToppings(
    page: number = 1,
    limit: number = 100,
  ): Promise<ToppingsGroup[]> {
    if (page < 1 || limit < 1) {
      throw new BadRequestException('Page and limit must be greater than 0');
    }
    try {
      return await this.toppingsGroupRepository.find({
        where: { isActive: true },
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logError('getAllToppingsGroupsWithoutToppings', { page, limit }, error);
      throw error;
    }
  }

  async getToppingsGroupByName(name: string): Promise<ToppingsGroup> {
    if (!name) {
      throw new BadRequestException('Either name must be provided.');
    }
    try {
      const toppingsGroup = await this.toppingsGroupRepository.findOne({
        where: { name: ILike(name) },
      });

      if (!toppingsGroup) {
        throw new NotFoundException(
          `Toppings Group with ID: ${name} not found`,
        );
      }
      return toppingsGroup;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logError('getToppingsGroupByName', { name }, error);
      throw error;
    }
  }

  async deleteToppingsGroup(id: string): Promise<string> {
    if (!id) {
      throw new BadRequestException('ID is required to delete toppings group');
    }
    try {
      const toppingsGroup = await this.getToppingsGroupById(id);
      if (!toppingsGroup) {
        throw new NotFoundException(`toppings group with ID ${id} not found`);
      }
      toppingsGroup.isActive = false;
      await this.toppingsGroupRepository.save(toppingsGroup);
      return `toppings group with ID ${id} has been deleted`;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logError('deleteToppingsGroup', { id }, error);
      throw error;
    }
  }
}
