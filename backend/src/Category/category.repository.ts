import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async getAllCategorys(page: number, limit: number): Promise<Category[]> {
    return await this.categoryRepository.find({
      where: { isActive: true },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getCategoryById(id: string): Promise<Category> {
    const categoryFinded = await this.categoryRepository.findOne({
      where: { id },
    });

    return categoryFinded;
  }

  async getCategoryByName(name: string): Promise<Category> {
    const categoryFinded = await this.categoryRepository
      .createQueryBuilder('category')
      .where('LOWER(category.name) = LOWER(:name)', { name })
      .getOne();

    return categoryFinded;
  }
}
