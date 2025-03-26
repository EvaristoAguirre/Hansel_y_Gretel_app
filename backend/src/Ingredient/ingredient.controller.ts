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
import { RolesGuard } from 'src/Guards/roles.guard';
import { Roles } from 'src/Decorators/roles.decorator';
import { UserRole } from 'src/Enums/roles.enum';
import { IngredientResponseDTO } from 'src/DTOs/ingredientSummaryResponse.dto';

@Controller('ingredient')
@UseGuards(RolesGuard)
export class IngredientController {
  constructor(private readonly ingredientService: IngredientService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getAllIngredients(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
  ): Promise<IngredientResponseDTO[]> {
    return await this.ingredientService.getAllIngredients(page, limit);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getIngredientById(
    @Param('id') id: string,
  ): Promise<IngredientResponseDTO> {
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
}
