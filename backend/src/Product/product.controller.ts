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
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { Product } from './product.entity';
import { UUID } from 'crypto';
import { UpdateProductDto } from 'src/DTOs/update-product-dto';
import { CreateProductDto } from 'src/DTOs/create-product.dto';
import { RolesGuard } from 'src/Guards/roles.guard';
import { Roles } from 'src/Decorators/roles.decorator';
import { UserRole } from 'src/Enums/roles.enum';
import { GetProductsByCategoriesDto } from 'src/DTOs/get-by-categories.dto';
import { ProductResponseDto } from 'src/DTOs/productResponse.dto';

@ApiTags('Producto')
@Controller('product')
@UseGuards(RolesGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getAllProducts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<ProductResponseDto[]> {
    return this.productService.getAllProducts(page, limit);
  }

  @Post('search')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async searchProducts(
    @Query('name') name?: string,
    @Query('code') code?: string,
    @Query('isActive') isActive?: boolean,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Body('categories') categories?: string[],
  ): Promise<ProductResponseDto[]> {
    return this.productService.searchProducts(
      name,
      code,
      categories,
      isActive,
      page,
      limit,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getProductById(@Param('id') id: UUID): Promise<Product> {
    return this.productService.getProductById(id);
  }
  @Get('by-code/:code')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getProductByCode(@Param('code') code: string): Promise<Product> {
    return this.productService.getProductByCode(+code);
  }

  @Get('by-name/:name')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getProductByName(@Param('name') name: string): Promise<Product> {
    return this.productService.getProductByName(name);
  }

  @Post('by-categories')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getProductsByCategories(
    @Body(ValidationPipe) body: GetProductsByCategoriesDto,
  ): Promise<ProductResponseDto[]> {
    const { categories } = body;
    if (!categories || categories.length === 0) {
      throw new BadRequestException(
        'At least one category ID must be provided.',
      );
    }
    return this.productService.getProductsByCategories(categories);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async createProduct(
    @Body() productToCreate: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return await this.productService.createProduct(productToCreate);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async updateProduct(
    @Body() updateData: UpdateProductDto,
    @Param('id') id: string,
  ) {
    return await this.productService.updateProduct(id, updateData);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async deleteProduct(@Param() id: UUID) {
    return await this.productService.deleteProduct(id);
  }
}
