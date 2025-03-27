import { Injectable } from '@nestjs/common';
import { UnitOfMeasure } from './unitOfMesure.entity';
import { UpdateUnitOfMeasureDto } from 'src/DTOs/update-unit.dto';
import { UnitOfMeasureRepository } from './unitOfMeasure.repository';
import { CreateUnitOfMeasureDto } from 'src/DTOs/create-unit.dto';
import { UnitOfMeasureSummaryResponseDto } from 'src/DTOs/unitOfMeasureSummaryResponse.dto';

@Injectable()
export class UnitOfMeasureService {
  constructor(private unitOfMeasureRepository: UnitOfMeasureRepository) {}

  async createUnitOfMeasure(
    createData: CreateUnitOfMeasureDto,
  ): Promise<UnitOfMeasureSummaryResponseDto> {
    return await this.unitOfMeasureRepository.createUnitOfMeasure(createData);
  }

  async getAllUnitOfMeasure(
    pageNumber: number,
    limitNumber: number,
  ): Promise<UnitOfMeasureSummaryResponseDto[]> {
    return await this.unitOfMeasureRepository.getAllUnitOfMeasure(
      pageNumber,
      limitNumber,
    );
  }

  async getUnitOfMeasureById(id: string): Promise<UnitOfMeasure> {
    return await this.unitOfMeasureRepository.getUnitOfMeasureById(id);
  }

  async updateUnitOfMeasure(
    id: string,
    updateData: UpdateUnitOfMeasureDto,
  ): Promise<UnitOfMeasureSummaryResponseDto> {
    return await this.unitOfMeasureRepository.updateUnitOfMeasure(
      id,
      updateData,
    );
  }

  async getConventionalUnitOfMeasure(
    pageNumber: number,
    limitNumber: number,
  ): Promise<UnitOfMeasureSummaryResponseDto[]> {
    return await this.unitOfMeasureRepository.getConventionalUnitOfMeasure(
      pageNumber,
      limitNumber,
    );
  }

  async getNotConventionalUnitOfMeasure(
    pageNumber: number,
    limitNumber: number,
  ): Promise<UnitOfMeasureSummaryResponseDto[]> {
    return await this.unitOfMeasureRepository.getNotConventionalUnitOfMeasure(
      pageNumber,
      limitNumber,
    );
  }

  async convertUnit(fromUnitId: string, toUnitId: string, quantity: number) {
    return await this.unitOfMeasureRepository.convertUnit(
      fromUnitId,
      toUnitId,
      quantity,
    );
  }

  async findConversionUnit() {
    return await this.unitOfMeasureRepository.findConversionUnit();
  }

  async deleteUnitOfMeasure(id: string) {
    return await this.unitOfMeasureRepository.deleteUnitOfMeasure(id);
  }

  async searchUnit(
    name?: string,
    abbreviation?: string,
  ): Promise<UnitOfMeasure[]> {
    return this.unitOfMeasureRepository.searchUnit(name, abbreviation);
  }
}
