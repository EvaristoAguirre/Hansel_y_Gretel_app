import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from '../DTOs/create-category.dto';
import { UpdateCategoryDto } from '../DTOs/update-category.dto';
import { CategoryRepository } from './category.repository';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}
  async createCategory(category: CreateCategoryDto) {
    return await this.categoryRepository.createCategory(category);
  }

  async updateCategory(id: string, category: UpdateCategoryDto) {
    return await this.categoryRepository.updateCategory(id, category);
  }

  async deleteCategory(id: string) {
    return await this.categoryRepository.deleteCategory(id);
  }
  async getAllCategorys(page: number, limit: number) {
    return await this.categoryRepository.getAllCategorys(page, limit);
  }

  async getCategoryById(id: string) {
    return await this.categoryRepository.getCategoryById(id);
  }
}
