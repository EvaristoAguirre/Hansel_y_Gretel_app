import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from 'src/DTOs/create-category.dto';
import { UpdateCategoryDto } from 'src/DTOs/update-category.dto';
import { isUUID } from 'class-validator';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}
  async createCategory(category: CreateCategoryDto): Promise<Category> {
    try {
      const categoryExists = await this.categoryRepository.findOne({
        where: { name: category.name },
      });
      if (categoryExists) {
        throw new ConflictException(
          'Category with the same name already exists',
        );
      }
      return await this.categoryRepository.save(category);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Failed to create category',
        error,
      );
    }
  }

  async updateCategory(
    id: string,
    category: UpdateCategoryDto,
  ): Promise<Category> {
    try {
      const existingCategory = await this.categoryRepository.findOne({
        where: { id },
      });
      if (!existingCategory) {
        throw new NotFoundException('Category not found');
      }
      Object.assign(existingCategory, category);
      return await this.categoryRepository.save(existingCategory);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Failed to update category',
        error,
      );
    }
  }

  async deleteCategory(id: string): Promise<string> {
    try {
      const category = await this.categoryRepository.findOne({ where: { id } });
      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      await this.categoryRepository.update(id, { isActive: false });
      return 'Category successfully deleted';
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Failed to deactivate category',
        error,
      );
    }
  }

  async getAllCategorys(page: number, limit: number): Promise<Category[]> {
    try {
      return await this.categoryRepository.find({
        where: { isActive: true },
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error fetching orders',
        error.message,
      );
    }
  }

  async getCategoryById(id: string): Promise<Category> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    try {
      const categoryFinded = await this.categoryRepository.findOne({
        where: { id },
      });
      if (!categoryFinded) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      if (categoryFinded && categoryFinded.isActive === false) {
        throw new ConflictException(`Category with ID ${id} is disabled`);
      }
      return categoryFinded;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error fetching the category',
        error.message,
      );
    }
  }
  async getCategoryByName(name: string): Promise<Category> {
    try {
      const categoryFinded = await this.categoryRepository
        .createQueryBuilder('category')
        .where('LOWER(category.name) = LOWER(:name)', { name })
        .getOne();

      // 1. Primero verificar si existe
      if (!categoryFinded) {
        throw new NotFoundException(`Category with name "${name}" not found`);
      }

      // 2. Luego verificar si está activa
      if (categoryFinded.isActive === false) {
        throw new ConflictException(`Category with name "${name}" is disabled`);
      }

      return categoryFinded;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error fetching the category',
        error.message,
      );
    }
  }
}
