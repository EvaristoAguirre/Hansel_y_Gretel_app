/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProviderService } from './provider.service';
import { CreateProviderDto } from '../DTOs/create-provider.dto';
import { UpdateProviderDto } from '../DTOs/update-provider.dto';
import { Provider } from './provider.entity';
import { RolesGuard } from 'src/Guards/roles.guard';
import { Roles } from 'src/Decorators/roles.decorator';
import { UserRole } from 'src/Enums/roles.enum';

@Controller('provider')
@UseGuards(RolesGuard)
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  createProvider(
    @Body() createProviderDto: CreateProviderDto,
  ): Promise<Provider> {
    return this.providerService.createProvider(createProviderDto);
  }
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  updateProvider(
    @Param('id') id: string,
    @Body() updateProviderDto: UpdateProviderDto,
  ): Promise<Provider> {
    return this.providerService.updateProvider(id, updateProviderDto);
  }
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  deleteProvider(@Param('id') id: string): Promise<string> {
    return this.providerService.deleteProvider(id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  getAllProviders(page: number = 1, limit: number = 1000): Promise<Provider[]> {
    return this.providerService.getAllProviders(page, limit);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  getProviderById(@Param('id') id: string): Promise<Provider> {
    return this.providerService.getProviderById(id);
  }
}
