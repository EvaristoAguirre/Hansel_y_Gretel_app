import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { SauceGroupsService } from './sauce-group.service';
import { Roles } from 'src/Decorators/roles.decorator';
import { UserRole } from 'src/Enums/roles.enum';
import { SauceGroup } from './sauce-group.entity';
import { UpdateSauceGroupDto } from 'src/DTOs/update-sauce-group.dto';
import { CreateSauceGroupDto } from 'src/DTOs/create-sauce-group.dto';

@Controller('sauce-group')
export class SauceGroupsController {
  constructor(private readonly sauceGroupsService: SauceGroupsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  createSauceGroup(
    @Body() createData: CreateSauceGroupDto,
  ): Promise<SauceGroup> {
    return this.sauceGroupsService.createSauceGroup(createData);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  updateSauceGroup(
    @Param('id') id: string,
    @Body() updateData: UpdateSauceGroupDto,
  ): Promise<SauceGroup> {
    return this.sauceGroupsService.updateSauceGroup(id, updateData);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  getSauceGroupById(@Param('id') id: string): Promise<SauceGroup> {
    return this.sauceGroupsService.getSauceGroupById(id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  getAllSauceGroups(): Promise<SauceGroup[]> {
    return this.sauceGroupsService.getAllSauceGroups();
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  deleteSauceGroup(@Param('id') id: string): Promise<string> {
    return this.sauceGroupsService.deleteSauceGroup(id);
  }
}
