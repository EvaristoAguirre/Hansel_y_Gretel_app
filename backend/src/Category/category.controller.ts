import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Put,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from '../DTOs/create-category.dto';
import { UpdateCategoryDto } from '../DTOs/update-category.dto';
import { Category } from './category.entity';
import { RolesGuard } from 'src/Guards/roles.guard';
import { Roles } from 'src/Decorators/roles.decorator';
import { UserRole } from 'src/Enums/roles.enum';

@ApiTags('Categoría')
@ApiBearerAuth('JWT-auth')
@Controller('category')
@UseGuards(RolesGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear nueva categoría',
    description:
      'Crea una nueva categoría para organizar productos. Requiere rol ADMIN o ENCARGADO.',
  })
  @ApiBody({
    type: CreateCategoryDto,
    description: 'Datos de la categoría',
    examples: {
      ejemplo: {
        value: {
          name: 'Bebidas Calientes',
          description: 'Cafés, tés e infusiones',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Categoría creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una categoría con ese nombre',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  createCategory(@Body() category: CreateCategoryDto): Promise<Category> {
    return this.categoryService.createCategory(category);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las categorías',
    description:
      'Devuelve una lista paginada de todas las categorías disponibles',
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
    example: 100,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorías obtenida exitosamente',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  getAllCategorys(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(1000000), ParseIntPipe)
    limit: number = 1000000,
  ): Promise<Category[]> {
    return this.categoryService.getAllCategorys(page, limit);
  }

  @Get('by-name/:name')
  @ApiOperation({
    summary: 'Buscar categoría por nombre',
    description: 'Busca una categoría específica por su nombre',
  })
  @ApiParam({
    name: 'name',
    type: String,
    description: 'Nombre de la categoría',
    example: 'Bebidas',
  })
  @ApiResponse({ status: 200, description: 'Categoría encontrada' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async getCategoryByName(@Param('name') name: string): Promise<Category> {
    return await this.categoryService.getCategoryByName(name);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener categoría por ID',
    description: 'Devuelve una categoría específica por su UUID',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID de la categoría' })
  @ApiResponse({ status: 200, description: 'Categoría encontrada' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  getCategoryById(@Param('id') id: string): Promise<Category> {
    return this.categoryService.getCategoryById(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar categoría',
    description:
      'Actualiza los datos de una categoría existente. Requiere rol ADMIN o ENCARGADO.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de la categoría a actualizar',
  })
  @ApiBody({ type: UpdateCategoryDto, description: 'Datos a actualizar' })
  @ApiResponse({
    status: 200,
    description: 'Categoría actualizada exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  updateCategory(
    @Param('id') id: string,
    @Body() category: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoryService.updateCategory(id, category);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar categoría',
    description:
      'Elimina una categoría del sistema. Requiere rol ADMIN o ENCARGADO.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de la categoría a eliminar',
  })
  @ApiResponse({ status: 200, description: 'Categoría eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar una categoría con productos asociados',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  deleteCategory(@Param('id') id: string): Promise<string> {
    return this.categoryService.deleteCategory(id);
  }
}
