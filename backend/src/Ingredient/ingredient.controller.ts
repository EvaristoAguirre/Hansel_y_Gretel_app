import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { IngredientService } from './ingredient.service';
import { Ingredient } from './ingredient.entity';
import { CreateIngredientDto } from 'src/DTOs/create-ingredient.dto';
import { UpdateIngredientDto } from 'src/DTOs/update-ingredient.dto';
import { UnitOfMeasure } from './unitOfMesure.entity';
import { CreateUnitOfMeasureDto } from 'src/DTOs/create-unit.dto';

@Controller('ingredient')
export class IngredientController {
  constructor(private readonly ingredientService: IngredientService) {}

  @Get()
  async getAllIngredients(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
  ): Promise<Ingredient[]> {
    return await this.ingredientService.getAllIngredients(page, limit);
  }

  @Get(':id')
  async getIngredientById(@Param() id: string): Promise<Ingredient> {
    return await this.ingredientService.getIngredientById(id);
  }

  @Post()
  async createIngredient(
    @Body() createData: CreateIngredientDto,
  ): Promise<Ingredient> {
    return await this.ingredientService.createIngredient(createData);
  }

  @Patch(':id')
  async updateIngredient(
    @Param('id') id: string,
    @Body() updateData: UpdateIngredientDto,
  ) {
    return await this.ingredientService.updateIngredient(id, updateData);
  }

  @Delete(':id')
  async deleteIngredient(@Param() id: string) {
    return await this.ingredientService.deleteIngredient(id);
  }

  // ---------------- Unit Of Mesure ---------- //

  @Post('unitofmeasure')
  async createUnitOfMeasure(
    @Body() createData: CreateUnitOfMeasureDto,
  ): Promise<UnitOfMeasure> {
    return await this.ingredientService.createUnitOfMeasure(createData);
  }

  @Get('unitofmeasure')
  async getAllUnitOfMeasure(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
  ): Promise<UnitOfMeasure[]> {
    return await this.ingredientService.getAllUnitOfMeasure(page, limit);
  }
  @Get('unitofmeasure/:id')
  async getUnitOfMeasureById(@Param() id: string): Promise<UnitOfMeasure> {
    return await this.ingredientService.getUnitOfMeasureById(id);
  }
}
