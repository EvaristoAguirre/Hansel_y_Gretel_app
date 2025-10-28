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
import { UnitOfMeasureService } from './unitOfMeasure.service';
import { Roles } from 'src/Decorators/roles.decorator';
import { UserRole } from 'src/Enums/roles.enum';
import { UnitOfMeasure } from './unitOfMesure.entity';
import { UpdateUnitOfMeasureDto } from 'src/DTOs/update-unit.dto';
import { CreateUnitOfMeasureDto } from 'src/DTOs/create-unit.dto';
import {
  EspecialUnitMeasureResponseDto,
  UnitOfMeasureSummaryResponseDto,
} from 'src/DTOs/unitOfMeasureSummaryResponse.dto';

@Controller('unitofmeasure')
export class UnitOfMeasureController {
  constructor(private readonly unitOfMeasureService: UnitOfMeasureService) {}

  @Get('conversion')
  async findConversionUnit() {
    return await this.unitOfMeasureService.findConversionUnit();
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async createUnitOfMeasure(
    @Body() createData: CreateUnitOfMeasureDto,
  ): Promise<UnitOfMeasureSummaryResponseDto> {
    return await this.unitOfMeasureService.createUnitOfMeasure(createData);
  }

  @Get('all')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async getAllUnitOfMeasure(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<UnitOfMeasureSummaryResponseDto[]> {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    return this.unitOfMeasureService.getAllUnitOfMeasure(
      pageNumber,
      limitNumber,
    );
  }

  @Get('conventional')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async getConventionalUnitOfMeasure(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<UnitOfMeasureSummaryResponseDto[]> {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    return await this.unitOfMeasureService.getConventionalUnitOfMeasure(
      pageNumber,
      limitNumber,
    );
  }

  @Get('not-conventional')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getNotConventionalUnitOfMeasure(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<UnitOfMeasureSummaryResponseDto[]> {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    return await this.unitOfMeasureService.getNotConventionalUnitOfMeasure(
      pageNumber,
      limitNumber,
    );
  }

  @Get('unit-of-volume')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getUnitOfVolume(): Promise<EspecialUnitMeasureResponseDto[]> {
    return await this.unitOfMeasureService.getUnitsOfVolume();
  }

  @Get('unit-of-mass')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getUnitOfMass(): Promise<EspecialUnitMeasureResponseDto[]> {
    return await this.unitOfMeasureService.getUnitsOfMass();
  }
  @Get('unit-of-unit')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getUnitOfUnit(): Promise<EspecialUnitMeasureResponseDto[]> {
    return await this.unitOfMeasureService.getUnitOfUnit();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async getUnitOfMeasureById(@Param('id') id: string): Promise<UnitOfMeasure> {
    return await this.unitOfMeasureService.getUnitOfMeasureById(id);
  }

  @Post('search')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async searchUnit(
    @Query('name') name?: string,
    @Query('abbreviation') abbreviation?: string,
  ): Promise<UnitOfMeasure[]> {
    return this.unitOfMeasureService.searchUnit(name, abbreviation);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async updateUnitOfMeasure(
    @Param('id') id: string,
    @Body() updateData: UpdateUnitOfMeasureDto,
  ): Promise<UnitOfMeasureSummaryResponseDto> {
    return await this.unitOfMeasureService.updateUnitOfMeasure(id, updateData);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async deleteUnitOfMeasure(@Param('id') id: string) {
    return await this.unitOfMeasureService.deleteUnitOfMeasure(id);
  }
}
