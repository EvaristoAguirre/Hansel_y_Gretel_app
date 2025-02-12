import { Controller, Get, Post, Query } from '@nestjs/common';
import { IngredientService } from './ingredient.service';
import { Ingredient } from './ingredient.entity';
import { CreateIngredientDto } from 'src/DTOs/create-ingredient.dto';

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

  // @Patch(){
  //   async updateIngredient(){
  //     return await this.ingredient
  //   }
  // }
}
