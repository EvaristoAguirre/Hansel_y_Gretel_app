import { Injectable } from '@nestjs/common';
import { TableRepository } from './table.repository';

@Injectable()
export class TableService {
  constructor(private readonly tableRepository: TableRepository) {}
}
