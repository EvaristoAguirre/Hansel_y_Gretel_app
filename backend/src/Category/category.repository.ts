import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { Repository } from 'typeorm';
import { LoggerService } from 'src/Monitoring/monitoring-logger.service';

@Injectable()
export class CategoryRepository {
  private readonly logger = new Logger(CategoryRepository.name);
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly loggerService: LoggerService,
  ) {}

  // /**
  //  * Método auxiliar para loguear errores con información estructurada
  //  * Centraliza el formato de logs para este repositorio
  //  */
  // private logError(
  //   operation: string,
  //   context: Record<string, any>,
  //   error: any,
  // ) {
  //   const errorInfo = {
  //     operation,
  //     repository: 'CategoryRepository',
  //     context,
  //     timestamp: new Date().toISOString(),
  //   };
  //   this.loggerService.error(errorInfo, error);
  // }

  async getAllCategorys(page: number, limit: number): Promise<Category[]> {
    try {
      return await this.categoryRepository.find({
        where: { isActive: true },
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (error) {
      this.logger.error('getAllCategorys', error);
      throw error;
    }
  }

  async getCategoryById(id: string): Promise<Category> {
    try {
      const categoryFinded = await this.categoryRepository.findOne({
        where: { id },
      });

      return categoryFinded;
    } catch (error) {
      this.logger.error('getCategoryById', error);
      throw error;
    }
  }

  async getCategoryByName(name: string): Promise<Category> {
    try {
      const categoryFinded = await this.categoryRepository
        .createQueryBuilder('category')
        .where('LOWER(category.name) = LOWER(:name)', { name })
        .getOne();

      return categoryFinded;
    } catch (error) {
      this.logger.error('getCategoryByName', error);
      throw error;
    }
  }
}
