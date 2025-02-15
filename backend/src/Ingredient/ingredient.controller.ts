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

  @Post()
  async createIngredient(createData: CreateIngredientDto): Promise<Ingredient> {
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
}
