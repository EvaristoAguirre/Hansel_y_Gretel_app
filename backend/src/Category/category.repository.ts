import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { DeleteResult, Repository } from 'typeorm';
import { CreateCategoryDto } from 'src/DTOs/create-category.dto';
import { UpdateCategoryDto } from 'src/DTOs/update-category.dto';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}
  async createCategory(category: CreateCategoryDto): Promise<Category> {
    return await this.categoryRepository.create(category);
  }

  async updateCategory(
    id: string,
    category: UpdateCategoryDto,
  ): Promise<Category> {
    await this.categoryRepository.update(id, category);
    return await this.categoryRepository.findOneOrFail({ where: { id } });
  }

  async deleteCategory(id: string): Promise<DeleteResult> {
    return await this.categoryRepository.delete(id);
  }

  async getAllCategorys(page: number, limit: number): Promise<Category[]> {
    return await this.categoryRepository.find({
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getCategoryById(id: string): Promise<Category> {
    return await this.categoryRepository.findOne({ where: { id } });
  }
}
