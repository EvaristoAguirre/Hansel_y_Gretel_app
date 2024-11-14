import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductRepository } from './product.repository';
import { CategoryModule } from 'src/Category/category.module';
import { CategoryRepository } from 'src/Category/category.repository';
import { Category } from 'src/Category/category.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Product, Category]), CategoryModule],
  controllers: [ProductController],
  providers: [ProductService, ProductRepository, CategoryRepository],
  exports: [],
})
export class ProductModule {}
