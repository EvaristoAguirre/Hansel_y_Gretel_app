import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { Product } from './product.entity';
import { UUID } from 'crypto';

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
  async getProductById(
    @Param('id') id: UUID,
    @Query('code') code: number,
  ): Promise<Product> {
    return this.productService.getProductById(id, code);
  }
}
