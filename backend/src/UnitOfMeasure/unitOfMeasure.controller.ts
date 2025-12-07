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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
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

@ApiTags('Unidad de Medida')
@ApiBearerAuth('JWT-auth')
@Controller('unitofmeasure')
export class UnitOfMeasureController {
  constructor(private readonly unitOfMeasureService: UnitOfMeasureService) {}

  @Get('conversion')
  @ApiOperation({
    summary: 'Obtener unidades de conversión',
    description: 'Devuelve las unidades que pueden usarse para conversiones',
  })
  @ApiResponse({ status: 200, description: 'Unidades de conversión' })
  async findConversionUnit() {
    return await this.unitOfMeasureService.findConversionUnit();
  }

  @Post()
  @ApiOperation({
    summary: 'Crear unidad de medida',
    description:
      'Crea una nueva unidad de medida. Requiere rol ADMIN o ENCARGADO.',
  })
  @ApiBody({
    type: CreateUnitOfMeasureDto,
    description: 'Datos de la unidad de medida',
    examples: {
      convencional: {
        summary: 'Unidad convencional',
        value: {
          name: 'Kilogramo',
          abbreviation: 'kg',
          type: 'MASS',
          isConventional: true,
        },
      },
      personalizada: {
        summary: 'Unidad personalizada',
        value: {
          name: 'Taza',
          abbreviation: 'tz',
          type: 'VOLUME',
          isConventional: false,
          conversionFactor: 250,
          baseUnitId: 'uuid-mililitros',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Unidad creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async createUnitOfMeasure(
    @Body() createData: CreateUnitOfMeasureDto,
  ): Promise<UnitOfMeasureSummaryResponseDto> {
    return await this.unitOfMeasureService.createUnitOfMeasure(createData);
  }

  @Get('all')
  @ApiOperation({
    summary: 'Obtener todas las unidades',
    description: 'Devuelve una lista paginada de todas las unidades de medida',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: String,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: String,
    description: 'Cantidad por página',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de unidades obtenida exitosamente',
  })
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
  @ApiOperation({
    summary: 'Obtener unidades convencionales',
    description:
      'Devuelve solo las unidades de medida convencionales/estándar (kg, L, unidad, etc.)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: String,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: String,
    description: 'Cantidad por página',
  })
  @ApiResponse({ status: 200, description: 'Lista de unidades convencionales' })
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
  @ApiOperation({
    summary: 'Obtener unidades personalizadas',
    description:
      'Devuelve las unidades de medida no convencionales/personalizadas',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: String,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: String,
    description: 'Cantidad por página',
  })
  @ApiResponse({ status: 200, description: 'Lista de unidades personalizadas' })
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
  @ApiOperation({
    summary: 'Obtener unidades de volumen',
    description:
      'Devuelve todas las unidades de medida de tipo volumen (L, mL, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Lista de unidades de volumen' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getUnitOfVolume(): Promise<EspecialUnitMeasureResponseDto[]> {
    return await this.unitOfMeasureService.getUnitsOfVolume();
  }

  @Get('unit-of-mass')
  @ApiOperation({
    summary: 'Obtener unidades de masa',
    description:
      'Devuelve todas las unidades de medida de tipo masa (kg, g, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Lista de unidades de masa' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getUnitOfMass(): Promise<EspecialUnitMeasureResponseDto[]> {
    return await this.unitOfMeasureService.getUnitsOfMass();
  }

  @Get('unit-of-unit')
  @ApiOperation({
    summary: 'Obtener unidades discretas',
    description:
      'Devuelve las unidades de medida discretas (unidad, docena, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Lista de unidades discretas' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getUnitOfUnit(): Promise<EspecialUnitMeasureResponseDto[]> {
    return await this.unitOfMeasureService.getUnitOfUnit();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener unidad por ID',
    description: 'Devuelve una unidad de medida específica por su UUID',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID de la unidad' })
  @ApiResponse({ status: 200, description: 'Unidad encontrada' })
  @ApiResponse({ status: 404, description: 'Unidad no encontrada' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async getUnitOfMeasureById(@Param('id') id: string): Promise<UnitOfMeasure> {
    return await this.unitOfMeasureService.getUnitOfMeasureById(id);
  }

  @Post('search')
  @ApiOperation({
    summary: 'Buscar unidades de medida',
    description: 'Busca unidades por nombre o abreviatura',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Buscar por nombre',
    example: 'kilo',
  })
  @ApiQuery({
    name: 'abbreviation',
    required: false,
    type: String,
    description: 'Buscar por abreviatura',
    example: 'kg',
  })
  @ApiResponse({ status: 200, description: 'Resultados de búsqueda' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async searchUnit(
    @Query('name') name?: string,
    @Query('abbreviation') abbreviation?: string,
  ): Promise<UnitOfMeasure[]> {
    return this.unitOfMeasureService.searchUnit(name, abbreviation);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar unidad de medida',
    description:
      'Actualiza los datos de una unidad de medida. Requiere rol ADMIN o ENCARGADO.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de la unidad a actualizar',
  })
  @ApiBody({ type: UpdateUnitOfMeasureDto, description: 'Datos a actualizar' })
  @ApiResponse({ status: 200, description: 'Unidad actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Unidad no encontrada' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async updateUnitOfMeasure(
    @Param('id') id: string,
    @Body() updateData: UpdateUnitOfMeasureDto,
  ): Promise<UnitOfMeasureSummaryResponseDto> {
    return await this.unitOfMeasureService.updateUnitOfMeasure(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar unidad de medida',
    description:
      'Elimina una unidad de medida del sistema. Requiere rol ADMIN o ENCARGADO.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de la unidad a eliminar',
  })
  @ApiResponse({ status: 200, description: 'Unidad eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Unidad no encontrada' })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar una unidad en uso',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async deleteUnitOfMeasure(@Param('id') id: string) {
    return await this.unitOfMeasureService.deleteUnitOfMeasure(id);
  }
}
