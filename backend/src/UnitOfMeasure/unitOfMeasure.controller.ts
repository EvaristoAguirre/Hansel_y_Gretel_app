import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UnitOfMeasureService } from './unitOfMeasure.service';
import { Roles } from 'src/Decorators/roles.decorator';
import { UserRole } from 'src/Enums/roles.enum';
import { UnitOfMeasure } from './unitOfMesure.entity';
import { UpdateUnitOfMeasureDto } from 'src/DTOs/update-unit.dto';
import { CreateUnitOfMeasureDto } from 'src/DTOs/create-unit.dto';

@Controller('unitOfMeasure')
export class UnitOfMeasureController {
  constructor(private readonly unitOfMeasureService: UnitOfMeasureService) {}

  @Post('unitofmeasure')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async createUnitOfMeasure(
    @Body() createData: CreateUnitOfMeasureDto,
  ): Promise<UnitOfMeasure> {
    return await this.unitOfMeasureService.createUnitOfMeasure(createData);
  }

  @Get('unitofmeasure/all')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getAllUnitOfMeasure(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<UnitOfMeasure[]> {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    return await this.unitOfMeasureService.getAllUnitOfMeasure(
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
    return await this.unitOfMeasureService.getConventionalUnitOfMeasure(
      pageNumber,
      limitNumber,
    );
  }

  @Get('unitofmeasure/:id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getUnitOfMeasureById(@Param('id') id: string): Promise<UnitOfMeasure> {
    return await this.unitOfMeasureService.getUnitOfMeasureById(id);
  }

  @Patch('unitofmeasure/:id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async updateUnitOfMeasure(
    @Param('id') id: string,
    @Body() updateData: UpdateUnitOfMeasureDto,
  ): Promise<UnitOfMeasure> {
    return await this.unitOfMeasureService.updateUnitOfMeasure(id, updateData);
  }
}
