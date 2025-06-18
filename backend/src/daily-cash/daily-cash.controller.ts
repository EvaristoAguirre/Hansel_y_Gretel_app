import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { DailyCashService } from './daily-cash.service';
import { CreateDailyCashDto } from '../DTOs/create-daily-cash.dto';
import { UpdateDailyCashDto } from 'src/DTOs/update-daily-cash.dto';
import { Roles } from 'src/Decorators/roles.decorator';
import { UserRole } from 'src/Enums/roles.enum';
import { DailyCash } from './daily-cash.entity';

@Controller('daily-cash')
@Roles(UserRole.ADMIN, UserRole.ENCARGADO)
export class DailyCashController {
  constructor(private readonly dailyCashService: DailyCashService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  openDailyCash(
    @Body() createDailyCashDto: CreateDailyCashDto,
  ): Promise<DailyCash> {
    return this.dailyCashService.openDailyCash(createDailyCashDto);
  }

  @Post('close/:id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  closeDailyCash(
    @Param('id') id: string,
    @Body() updateDailyCashDto: UpdateDailyCashDto,
  ): Promise<DailyCash> {
    return this.dailyCashService.closeDailyCash(id, updateDailyCashDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  getAllDailysCash(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ): Promise<DailyCash[]> {
    return this.dailyCashService.getAllDailyCash(page, limit);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  getDailyCashById(@Param('id') id: string): Promise<DailyCash> {
    return this.dailyCashService.getDailyCashById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  updateDailyCash(
    @Param('id') id: string,
    @Body() updateDailyCashDto: UpdateDailyCashDto,
  ) {
    return this.dailyCashService.updateDailyCash(+id, updateDailyCashDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  deleteDailyCash(@Param('id') id: string) {
    return this.dailyCashService.deleteDailyCash(+id);
  }
}
