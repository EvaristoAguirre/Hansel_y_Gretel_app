import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ToppingsGroupsService } from './toppings-group.service';
import { Roles } from 'src/Decorators/roles.decorator';
import { UserRole } from 'src/Enums/roles.enum';
import { ToppingsGroup } from './toppings-group.entity';
import { CreateToppingsGroupDto } from 'src/DTOs/create-toppings-group.dto';
import { UpdateToppingsGroupDto } from 'src/DTOs/update-toppings-group.dto';

@Controller('toppings-group')
export class ToppingsGroupsController {
  constructor(private readonly toppingsGroupsService: ToppingsGroupsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  createToppingsGroup(
    @Body() createData: CreateToppingsGroupDto,
  ): Promise<ToppingsGroup> {
    return this.toppingsGroupsService.createToppingsGroup(createData);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  updateToppingsGroup(
    @Param('id') id: string,
    @Body() updateData: UpdateToppingsGroupDto,
  ): Promise<ToppingsGroup> {
    return this.toppingsGroupsService.updateToppingsGroup(id, updateData);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  getAllToppingsGroups(): Promise<ToppingsGroup[]> {
    return this.toppingsGroupsService.getAllToppingsGroups();
  }
  @Get('without-toppings')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  getAllToppingsGroupsWithoutToppings(): Promise<ToppingsGroup[]> {
    return this.toppingsGroupsService.getAllToppingsGroupsWithoutToppings();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  getToppingsGroupById(@Param('id') id: string): Promise<ToppingsGroup> {
    return this.toppingsGroupsService.getToppingsGroupById(id);
  }

  @Get('by-name/:name')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO)
  async getToppingsGroupByName(
    @Param('name') name: string,
  ): Promise<ToppingsGroup> {
    return this.toppingsGroupsService.getToppingsGroupByName(name);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  deleteToppingsGroup(@Param('id') id: string): Promise<string> {
    return this.toppingsGroupsService.deleteToppingsGroup(id);
  }
}
