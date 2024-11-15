import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from 'src/DTOs/create-category.dto';
import { UpdateCategoryDto } from 'src/DTOs/update-category.dto';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}
  async createCategory(category: CreateCategoryDto): Promise<Category> {
    const categoryCreated = await this.categoryRepository.create(category);
    await this.categoryRepository.save(categoryCreated);
    return categoryCreated;
  }

  async updateCategory(
    id: string,
    category: UpdateCategoryDto,
  ): Promise<Category> {
    await this.categoryRepository.update(id, category);
    return await this.categoryRepository.findOneOrFail({ where: { id } });
  }

  async deleteCategory(id: string): Promise<string> {
    await this.categoryRepository.update(id, { isActive: false });
    return 'Categoría borrada';
  }

  async getAllCategorys(page: number, limit: number): Promise<Category[]> {
    return await this.categoryRepository.find({
      where: { isActive: true },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getCategoryById(id: string): Promise<Category> {
    return await this.categoryRepository.findOne({ where: { id } });
  }
}
