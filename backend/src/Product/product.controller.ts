import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { Product } from './product.entity';
import { UUID } from 'crypto';
import { UpdateProductDto } from 'src/DTOs/update-product-dto';

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

  @Post()
  async createProduct(@Body() product) {
    return await this.productService.createProduct(product);
  }

  @Put(':id')
  async updateProduct(@Body() product: UpdateProductDto, @Param() id: string) {
    return await this.productService.updateProduct(id, product);
  }

  @Delete(':id')
  async deleteProduct(@Param() id: UUID) {
    return await this.productService.deleteProduct(id);
  }
}
