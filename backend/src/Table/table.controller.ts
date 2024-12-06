import { Controller } from '@nestjs/common';
import { TableService } from './table.service';

@Controller('tables')
export class TableController {
  constructor(private readonly tableService: TableService) {}
}
