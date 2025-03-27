import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from '../DTOs/create-category.dto';
import { UpdateCategoryDto } from '../DTOs/update-category.dto';
import { CategoryRepository } from './category.repository';
import { Category } from './category.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  async createCategory(category: CreateCategoryDto): Promise<Category> {
    const categoryCreated =
      await this.categoryRepository.createCategory(category);
    await this.eventEmitter.emit('category.created', {
      category: categoryCreated,
    });
    return categoryCreated;
  }

  async updateCategory(
    id: string,
    category: UpdateCategoryDto,
  ): Promise<Category> {
    const categoryUpdated = await this.categoryRepository.updateCategory(
      id,
      category,
    );
    await this.eventEmitter.emit('category.updated', {
      category: categoryUpdated,
    });
    return categoryUpdated;
  }

  async deleteCategory(id: string): Promise<string> {
    const categoryDeleted = await this.categoryRepository.deleteCategory(id);
    await this.eventEmitter.emit('category.deleted', {
      category: categoryDeleted,
    });
    return categoryDeleted;
  }
  async getAllCategorys(page: number, limit: number): Promise<Category[]> {
    return await this.categoryRepository.getAllCategorys(page, limit);
  }

  async getCategoryById(id: string): Promise<Category> {
    return await this.categoryRepository.getCategoryById(id);
  }

  async getCategoryByName(name: string): Promise<Category> {
    return await this.categoryRepository.getCategoryByName(name);
  }
}
