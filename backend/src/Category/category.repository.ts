import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const existingCategory = await this.categoryRepository.findOneOrFail({
        where: { id },
      });
      await this.categoryRepository.update(id, category);
      return await this.categoryRepository.findOneOrFail({ where: { id } });
    } catch (error) {
      throw new NotFoundException(`Category with ID ${id} not found`, error);
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
      throw new InternalServerErrorException(
        'Failed to retrieve all categories',
        error,
      );
    }
  }

  async getCategoryById(id: string): Promise<Category> {
    try {
      return await this.categoryRepository.findOneOrFail({ where: { id } });
    } catch (error) {
      throw new NotFoundException(`Category with ID ${id} not found`, error);
    }
  }
}
