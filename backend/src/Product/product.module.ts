import { forwardRef, Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductRepository } from './product.repository';
import { CategoryModule } from 'src/Category/category.module';
import { CategoryRepository } from 'src/Category/category.repository';
import { Category } from 'src/Category/category.entity';
import { UnitOfMeasure } from 'src/Ingredient/unitOfMesure.entity';
import { UserModule } from 'src/User/user.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category, UnitOfMeasure]),
    forwardRef(() => CategoryModule),
    UserModule,
  ],
  controllers: [ProductController],
  providers: [ProductService, ProductRepository, CategoryRepository],
  exports: [ProductService],
})
export class ProductModule {}
