import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { UUID } from 'crypto';
import { UpdateProductDto } from 'src/Product/dtos/update-product-dto';
import { CreateProductDto } from 'src/Product/dtos/create-product.dto';
import { RolesGuard } from 'src/Guards/roles.guard';
import { Roles } from 'src/Decorators/roles.decorator';
import { UserRole } from 'src/Enums/roles.enum';
import { GetProductsByCategoriesDto } from 'src/DTOs/get-by-categories.dto';
import { ProductResponseDto } from 'src/DTOs/productResponse.dto';
import { CheckStockDto } from 'src/DTOs/checkStock.dto';
import { CreatePromotionWithSlotsDto } from '../dtos/create-promotion-with-slots.dto';

@ApiTags('Producto')
@ApiBearerAuth('JWT-auth')
@Controller('product')
@UseGuards(RolesGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los productos',
    description:
      'Devuelve una lista paginada de todos los productos (simples, compuestos y promociones)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad por página',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos obtenida exitosamente',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token JWT inválido o faltante',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async getAllProducts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ): Promise<ProductResponseDto[]> {
    return this.productService.getAllProducts(page, limit);
  }

  @Get('not-promotion')
  @ApiOperation({
    summary: 'Obtener productos sin promociones',
    description:
      'Devuelve productos simples y compuestos, excluyendo promociones. Útil para crear promociones.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad por página',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos obtenida exitosamente',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async getSimpleAndCompositeProducts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ) {
    return this.productService.getSimpleAndCompositeProducts(page, limit);
  }

  @Get('by-name')
  @ApiOperation({
    summary: 'Buscar producto por nombre',
    description: 'Busca un producto específico por su nombre exacto',
  })
  @ApiQuery({
    name: 'name',
    required: true,
    type: String,
    description: 'Nombre del producto',
    example: 'café con leche',
  })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async getProductByName(
    @Query('name') name: string,
  ): Promise<ProductResponseDto> {
    return this.productService.getProductByName(name);
  }

  @Post('prod-to-prom')
  @ApiOperation({
    summary: 'Buscar productos para promoción',
    description: 'Busca productos que pueden ser agregados a una promoción',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filtrar por activos',
    example: true,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad por página',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Filtrar por nombre',
  })
  @ApiQuery({
    name: 'code',
    required: false,
    type: Number,
    description: 'Filtrar por código',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos para promoción',
  })
  async searchProductsToPromotion(
    @Query('isActive') isActive: boolean = true,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query('name') name?: string,
    @Query('code') code?: number,
  ): Promise<ProductResponseDto[]> {
    return this.productService.searchProductsToPromotion(
      isActive,
      page,
      limit,
      name,
      code,
    );
  }

  @Post('search')
  @ApiOperation({
    summary: 'Búsqueda avanzada de productos',
    description:
      'Permite buscar productos con múltiples filtros: nombre, código, categorías y estado activo',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Buscar por nombre (parcial)',
  })
  @ApiQuery({
    name: 'code',
    required: false,
    type: String,
    description: 'Buscar por código',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filtrar por estado activo',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad por página',
  })
  @ApiBody({
    description: 'IDs de categorías para filtrar (opcional)',
    required: false,
    schema: {
      type: 'object',
      properties: {
        categories: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          example: ['uuid-categoria-1', 'uuid-categoria-2'],
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Resultados de búsqueda' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async searchProducts(
    @Query('name') name?: string,
    @Query('code') code?: string,
    @Query('isActive') isActive: boolean = true,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
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
  @ApiOperation({
    summary: 'Obtener producto por ID',
    description: 'Devuelve un producto específico con todos sus detalles',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del producto',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async getProductById(@Param('id') id: UUID): Promise<ProductResponseDto> {
    return this.productService.getProductById(id);
  }

  @Get('by-code/:code')
  @ApiOperation({
    summary: 'Obtener producto por código',
    description: 'Busca un producto por su código numérico único',
  })
  @ApiParam({
    name: 'code',
    type: String,
    description: 'Código del producto',
    example: '101',
  })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async getProductByCode(
    @Param('code') code: string,
  ): Promise<ProductResponseDto> {
    return this.productService.getProductByCode(+code);
  }

  @Post('by-categories')
  @ApiOperation({
    summary: 'Obtener productos por categorías',
    description:
      'Devuelve todos los productos que pertenecen a las categorías especificadas',
  })
  @ApiBody({
    type: GetProductsByCategoriesDto,
    description: 'Lista de IDs de categorías',
    examples: {
      ejemplo: {
        value: {
          categories: ['uuid-categoria-1', 'uuid-categoria-2'],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos filtrada por categorías',
  })
  @ApiResponse({
    status: 400,
    description: 'Debe proporcionar al menos una categoría',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
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
  @ApiOperation({
    summary: 'Crear nuevo producto',
    description:
      'Crea un nuevo producto (simple, compuesto o promoción). Requiere rol ADMIN o ENCARGADO.',
  })
  @ApiBody({
    type: CreateProductDto,
    description: 'Datos del producto a crear',
    examples: {
      productoSimple: {
        summary: 'Producto simple',
        value: {
          name: 'Café Americano',
          code: 101,
          description: 'Café negro tradicional',
          price: 1500,
          cost: 300,
          categories: ['uuid-categoria-bebidas'],
          type: 'product',
        },
      },
      productoConToppings: {
        summary: 'Producto con toppings',
        value: {
          name: 'Café Personalizable',
          price: 1800,
          allowsToppings: true,
          availableToppingGroups: [
            {
              toppingsGroupId: 'uuid-grupo-leches',
              quantityOfTopping: 1,
            },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Producto creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de producto inválidos' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para crear productos',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async createProduct(
    @Body() productToCreate: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return await this.productService.createProduct(productToCreate);
  }

  // --------------------- ENDPOINT PARA PROMOS CON SLOTS ----------
  /*
   * sumary: 'Crear promotion con slots'
   * description: 'Crea una nueva promotion con slots. Los slots ya existen en la base de datos, hay que asignarlos'
   * body: CreatePromotionWithSlotsDto
   * response: ProductResponseDto
   * roles: ADMIN, ENCARGADO
   */
  @Post('promo-with-slots')
  createPromotionWithSlots(
    @Body() createPromotionWithSlots: CreatePromotionWithSlotsDto,
  ) {
    return this.productService.createPromotionWithSlots(
      createPromotionWithSlots,
    );
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar producto',
    description:
      'Actualiza los datos de un producto existente. Requiere rol ADMIN o ENCARGADO.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del producto a actualizar',
  })
  @ApiBody({ type: UpdateProductDto, description: 'Datos a actualizar' })
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para actualizar productos',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async updateProduct(
    @Body() updateData: UpdateProductDto,
    @Param('id') id: string,
  ): Promise<ProductResponseDto> {
    return await this.productService.updateProduct(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar producto',
    description:
      'Elimina (desactiva) un producto del sistema. Requiere rol ADMIN o ENCARGADO.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del producto a eliminar',
  })
  @ApiResponse({ status: 200, description: 'Producto eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para eliminar productos',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async deleteProduct(@Param('id') id: UUID) {
    return await this.productService.deleteProduct(id);
  }

  @Post('check-stock')
  @ApiOperation({
    summary: 'Verificar disponibilidad de stock',
    description:
      'Verifica si hay stock suficiente para los productos especificados',
  })
  @ApiBody({
    type: CheckStockDto,
    description: 'Productos y cantidades a verificar',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado de verificación de stock',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async checkProductsStockAvailability(@Body() dataToCheck: CheckStockDto) {
    return this.productService.checkProductsStockAvailability(dataToCheck);
  }
}
