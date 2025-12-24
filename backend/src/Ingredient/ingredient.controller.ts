import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
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
import { IngredientService } from './ingredient.service';
import { Ingredient } from './ingredient.entity';
import { CreateIngredientDto } from 'src/DTOs/create-ingredient.dto';
import { UpdateIngredientDto } from 'src/DTOs/update-ingredient.dto';
import { RolesGuard } from 'src/Guards/roles.guard';
import { Roles } from 'src/Decorators/roles.decorator';
import { UserRole } from 'src/Enums/roles.enum';
import { IngredientResponseDTO } from 'src/DTOs/ingredientSummaryResponse.dto';
import { ToppingResponseDto } from 'src/DTOs/toppingSummaryResponse.dto';
import { UpdateToppingDto } from 'src/DTOs/update-topping.dto';

@ApiTags('Ingrediente')
@ApiBearerAuth('JWT-auth')
@Controller('ingredient')
@UseGuards(RolesGuard)
export class IngredientController {
  constructor(private readonly ingredientService: IngredientService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener ingredientes y toppings',
    description:
      'Devuelve una lista paginada de todos los ingredientes incluyendo toppings',
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
    description: 'Lista de ingredientes obtenida exitosamente',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async getAllIngredientsAndToppings(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
  ): Promise<IngredientResponseDTO[]> {
    return await this.ingredientService.getAllIngredientsAndToppings(
      page,
      limit,
    );
  }

  @Get('all')
  @ApiOperation({
    summary: 'Obtener solo ingredientes',
    description: 'Devuelve una lista paginada de ingredientes (sin toppings)',
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
    description: 'Lista de ingredientes obtenida exitosamente',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async getAllIngredients(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
  ): Promise<IngredientResponseDTO[]> {
    return await this.ingredientService.getAllIngredients(page, limit);
  }

  @Get('toppings/by-name')
  @ApiOperation({
    summary: 'Buscar topping por nombre',
    description: 'Busca un topping específico por su nombre',
  })
  @ApiQuery({
    name: 'name',
    required: true,
    type: String,
    description: 'Nombre del topping',
    example: 'Crema',
  })
  @ApiResponse({ status: 200, description: 'Topping encontrado' })
  @ApiResponse({ status: 404, description: 'Topping no encontrado' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async getToppingByName(
    @Query('name') name: string,
  ): Promise<ToppingResponseDto> {
    return await this.ingredientService.getToppingByName(name);
  }

  @Get('by-name')
  @ApiOperation({
    summary: 'Buscar ingrediente por nombre',
    description: 'Busca un ingrediente específico por su nombre',
  })
  @ApiQuery({
    name: 'name',
    required: true,
    type: String,
    description: 'Nombre del ingrediente',
    example: 'Leche',
  })
  @ApiResponse({ status: 200, description: 'Ingrediente encontrado' })
  @ApiResponse({ status: 404, description: 'Ingrediente no encontrado' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async getIngredientByName(@Query('name') name: string): Promise<Ingredient> {
    return await this.ingredientService.getIngredientByName(name);
  }

  @Get('toppings')
  @ApiOperation({
    summary: 'Obtener todos los toppings',
    description:
      'Devuelve una lista paginada de todos los toppings disponibles',
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
    description: 'Lista de toppings obtenida exitosamente',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async getAllToppings(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
  ): Promise<ToppingResponseDto[]> {
    return await this.ingredientService.getAllToppings(page, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener ingrediente por ID',
    description: 'Devuelve un ingrediente específico por su UUID',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID del ingrediente' })
  @ApiResponse({ status: 200, description: 'Ingrediente encontrado' })
  @ApiResponse({ status: 404, description: 'Ingrediente no encontrado' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async getIngredientById(
    @Param('id') id: string,
  ): Promise<IngredientResponseDTO> {
    return await this.ingredientService.getIngredientById(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear nuevo ingrediente',
    description:
      'Crea un nuevo ingrediente o topping. Requiere rol ADMIN o ENCARGADO.',
  })
  @ApiBody({
    type: CreateIngredientDto,
    description: 'Datos del ingrediente',
    examples: {
      ingrediente: {
        summary: 'Ingrediente básico',
        value: {
          name: 'Leche Entera',
          unitOfMeasureId: 'uuid-unidad-litros',
          cost: 500,
          isTopping: false,
        },
      },
      topping: {
        summary: 'Topping',
        value: {
          name: 'Crema Chantilly',
          unitOfMeasureId: 'uuid-unidad-gramos',
          cost: 200,
          isTopping: true,
          price: 300,
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Ingrediente creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async createIngredient(
    @Body() createData: CreateIngredientDto,
  ): Promise<Ingredient> {
    console.log(createData);
    return await this.ingredientService.createIngredient(createData);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar ingrediente',
    description:
      'Actualiza los datos de un ingrediente existente. Requiere rol ADMIN o ENCARGADO.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del ingrediente a actualizar',
  })
  @ApiBody({ type: UpdateIngredientDto, description: 'Datos a actualizar' })
  @ApiResponse({
    status: 200,
    description: 'Ingrediente actualizado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Ingrediente no encontrado' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async updateIngredient(
    @Param('id') id: string,
    @Body() updateData: UpdateIngredientDto,
  ) {
    return await this.ingredientService.updateIngredient(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar ingrediente',
    description:
      'Elimina un ingrediente del sistema. Requiere rol ADMIN o ENCARGADO.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del ingrediente a eliminar',
  })
  @ApiResponse({
    status: 200,
    description: 'Ingrediente eliminado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Ingrediente no encontrado' })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar un ingrediente en uso',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async deleteIngredient(@Param('id') id: string) {
    return await this.ingredientService.deleteIngredient(id);
  }

  @Get('toppings/:id')
  @ApiOperation({
    summary: 'Obtener topping por ID',
    description: 'Devuelve un topping específico por su UUID',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID del topping' })
  @ApiResponse({ status: 200, description: 'Topping encontrado' })
  @ApiResponse({ status: 404, description: 'Topping no encontrado' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async getToppingById(@Param('id') id: string): Promise<ToppingResponseDto> {
    return await this.ingredientService.getToppingById(id);
  }

  @Patch('toppings/:id')
  @ApiOperation({
    summary: 'Actualizar topping',
    description: 'Actualiza los datos de un topping existente',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del topping a actualizar',
  })
  @ApiBody({ type: UpdateToppingDto, description: 'Datos a actualizar' })
  @ApiResponse({ status: 200, description: 'Topping actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Topping no encontrado' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async updateTopping(
    @Param('id') id: string,
    @Body() updateToppingDto: UpdateToppingDto,
  ) {
    return this.ingredientService.updateTopping(id, updateToppingDto);
  }
}
