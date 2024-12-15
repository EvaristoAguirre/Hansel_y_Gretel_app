import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { Product } from './product.entity';
import { UUID } from 'crypto';
import { UpdateProductDto } from 'src/DTOs/update-product-dto';
import { CreateProductDto } from 'src/DTOs/create-product.dto';
import { GetProductsByCategoriesDto } from 'src/DTOs/get-by-categories.dto';

@ApiTags('Producto')
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async getAllProducts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<Product[]> {
    return this.productService.getAllProducts(page, limit);
  }

  @Get(':id')
  async getProductById(@Param('id') id: UUID): Promise<Product> {
    return this.productService.getProductById(id);
  }
  @Get('by-code/:code')
  async getProductByCode(@Param('code') code: string): Promise<Product> {
    return this.productService.getProductByCode(+code);
  }

  @Get('by-categories')
  async getProductsByCategories(
    @Query(ValidationPipe) query: GetProductsByCategoriesDto,
  ): Promise<Product[]> {
    const { categoryIds } = query;
    console.log('Category IDs:', query.categoryIds);
    if (!categoryIds || categoryIds.length === 0) {
      throw new BadRequestException(
        'At least one category ID must be provided.',
      );
    }
    return this.productService.getProductsByCategories(query.categoryIds);
  }

  @Post()
  async createProduct(@Body() productToCreate: CreateProductDto) {
    return await this.productService.createProduct(productToCreate);
  }

  @Put(':id')
  async updateProduct(
    @Body() updateData: UpdateProductDto,
    @Param('id') id: string,
  ) {
    return await this.productService.updateProduct(id, updateData);
  }

  @Delete(':id')
  async deleteProduct(@Param() id: UUID) {
    return await this.productService.deleteProduct(id);
  }
}
