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
import { IngredientService } from './ingredient.service';
import { Ingredient } from './ingredient.entity';
import { CreateIngredientDto } from 'src/DTOs/create-ingredient.dto';
import { UpdateIngredientDto } from 'src/DTOs/update-ingredient.dto';
import { UnitOfMeasure } from './unitOfMesure.entity';
import { CreateUnitOfMeasureDto } from 'src/DTOs/create-unit.dto';
import { UpdateUnitOfMeasureDto } from 'src/DTOs/update-unit.dto';
import { RolesGuard } from 'src/Guards/roles.guard';
import { Roles } from 'src/Decorators/roles.decorator';
import { UserRole } from 'src/Enums/roles.enum';

@Controller('ingredient')
@UseGuards(RolesGuard)
export class IngredientController {
  constructor(private readonly ingredientService: IngredientService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getAllIngredients(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
  ): Promise<Ingredient[]> {
    return await this.ingredientService.getAllIngredients(page, limit);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getIngredientById(@Param('id') id: string): Promise<Ingredient> {
    return await this.ingredientService.getIngredientById(id);
  }

  @Get('by-name/:name')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getIngredientByName(@Param('name') name: string): Promise<Ingredient> {
    return await this.ingredientService.getIngredientByName(name);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async createIngredient(
    @Body() createData: CreateIngredientDto,
  ): Promise<Ingredient> {
    return await this.ingredientService.createIngredient(createData);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async updateIngredient(
    @Param('id') id: string,
    @Body() updateData: UpdateIngredientDto,
  ) {
    return await this.ingredientService.updateIngredient(id, updateData);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async deleteIngredient(@Param('id') id: string) {
    return await this.ingredientService.deleteIngredient(id);
  }

  // ---------------- Unit Of Mesure ---------- //

  @Post('unitofmeasure')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async createUnitOfMeasure(
    @Body() createData: CreateUnitOfMeasureDto,
  ): Promise<UnitOfMeasure> {
    return await this.ingredientService.createUnitOfMeasure(createData);
  }

  @Get('unitofmeasure/all')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getAllUnitOfMeasure(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<UnitOfMeasure[]> {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    return await this.ingredientService.getAllUnitOfMeasure(
      pageNumber,
      limitNumber,
    );
  }

  @Get('unitofmeasure/conventional')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getConventionalUnitOfMeasure(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<UnitOfMeasure[]> {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    return await this.ingredientService.getConventionalUnitOfMeasure(
      pageNumber,
      limitNumber,
    );
  }

  @Get('unitofmeasure/:id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getUnitOfMeasureById(@Param('id') id: string): Promise<UnitOfMeasure> {
    return await this.ingredientService.getUnitOfMeasureById(id);
  }

  @Patch('unitofmeasure/:id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async updateUnitOfMeasure(
    @Param('id') id: string,
    @Body() updateData: UpdateUnitOfMeasureDto,
  ): Promise<UnitOfMeasure> {
    return await this.ingredientService.updateUnitOfMeasure(id, updateData);
  }
}
