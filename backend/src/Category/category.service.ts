import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from '../DTOs/create-category.dto';
import { UpdateCategoryDto } from '../DTOs/update-category.dto';
import { Category } from './category.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryRepository } from './category.repository';
import { isUUID } from 'class-validator';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
    private readonly categoryRepository: CategoryRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createCategory(category: CreateCategoryDto): Promise<Category> {
    const categoryExists = await this.repo.findOne({
      where: { name: category.name },
    });
    if (categoryExists) {
      throw new ConflictException('Category with the same name already exists');
    }
    const categoryCreated = this.repo.create(category);

    await this.repo.save(categoryCreated);

    if (categoryCreated) {
      this.eventEmitter.emit('category.created', {
        category: categoryCreated,
      });
    }
    return categoryCreated;
  }

  async updateCategory(
    id: string,
    category: UpdateCategoryDto,
  ): Promise<Category> {
    try {
      const existingCategory = await this.repo.findOne({
        where: { id },
      });
      if (!existingCategory) {
        throw new NotFoundException('Category not found');
      }

      Object.assign(existingCategory, category);

      const updatedCategory = await this.repo.save(existingCategory);
      if (updatedCategory) {
        this.eventEmitter.emit('category.updated', {
          category: updatedCategory,
        });
      }

      return updatedCategory;
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
      const category = await this.repo.findOne({ where: { id } });
      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      const categoryDeleted = await this.repo.update(id, { isActive: false });

      this.eventEmitter.emit('category.deleted', {
        category: categoryDeleted,
      });

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
      return await this.categoryRepository.getAllCategorys(page, limit);
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
      const categoryFinded = await this.categoryRepository.getCategoryById(id);
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
    if (!name) {
      throw new BadRequestException('Category name must be provided.');
    }
    try {
      const categoryFinded =
        await this.categoryRepository.getCategoryByName(name);

      if (!categoryFinded) {
        throw new NotFoundException(`Category with name "${name}" not found`);
      }

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
