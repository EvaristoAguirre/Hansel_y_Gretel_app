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
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from '../DTOs/create-category.dto';
import { UpdateCategoryDto } from '../DTOs/update-category.dto';
import { Category } from './category.entity';
import { RolesGuard } from 'src/Guards/roles.guard';
import { Roles } from 'src/Decorators/roles.decorator';
import { UserRole } from 'src/Enums/roles.enum';

@Controller('category')
@UseGuards(RolesGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  createCategory(@Body() category: CreateCategoryDto): Promise<Category> {
    return this.categoryService.createCategory(category);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  getAllCategorys(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 1000000,
  ): Promise<Category[]> {
    return this.categoryService.getAllCategorys(page, limit);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  getCategoryById(@Param('id') id: string): Promise<Category> {
    return this.categoryService.getCategoryById(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  updateCategory(
    @Param('id') id: string,
    @Body() category: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoryService.updateCategory(id, category);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  deleteCategory(@Param('id') id: string): Promise<string> {
    return this.categoryService.deleteCategory(id);
  }
}
