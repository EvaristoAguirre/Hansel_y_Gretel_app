import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DailyCashService } from './daily-cash.service';
import { CreateDailyCashDto } from '../DTOs/create-daily-cash.dto';
import { UpdateDailyCashDto } from 'src/DTOs/update-daily-cash.dto';

@Controller('daily-cash')
export class DailyCashController {
  constructor(private readonly dailyCashService: DailyCashService) {}

  @Post()
  create(@Body() createDailyCashDto: CreateDailyCashDto) {
    return this.dailyCashService.createDailyCash(createDailyCashDto);
  }

  @Get()
  getAllDailysCash() {
    return this.dailyCashService.getAllDailyCash();
  }

  @Get(':id')
  getDailyCashById(@Param('id') id: string) {
    return this.dailyCashService.getDailyCashById(+id);
  }

  @Patch(':id')
  updateDailyCash(
    @Param('id') id: string,
    @Body() updateDailyCashDto: UpdateDailyCashDto,
  ) {
    return this.dailyCashService.updateDailyCash(+id, updateDailyCashDto);
  }

  @Delete(':id')
  deleteDailyCash(@Param('id') id: string) {
    return this.dailyCashService.deleteDailyCash(+id);
  }
}
