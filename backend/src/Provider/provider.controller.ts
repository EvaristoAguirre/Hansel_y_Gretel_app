import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProviderService } from './provider.service';
import { CreateProviderDto } from '../DTOs/create-provider.dto';
import { UpdateProviderDto } from '../DTOs/update-provider.dto';
import { Provider } from './provider.entity';

@Controller('provider')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Post()
  createProvider(
    @Body() createProviderDto: CreateProviderDto,
  ): Promise<Provider> {
    return this.providerService.createProvider(createProviderDto);
  }
  @Patch(':id')
  updateProvider(
    @Param('id') id: string,
    @Body() updateProviderDto: UpdateProviderDto,
  ) {
    return this.providerService.updateProvider(id, updateProviderDto);
  }
  @Delete(':id')
  deleteProvider(@Param('id') id: string): Promise<string> {
    return this.providerService.deleteProvider(id);
  }

  @Get()
  getAllProviders(page: number, limit: number): Promise<Provider[]> {
    return this.providerService.getAllProviders(page, limit);
  }

  @Get(':id')
  getProviderById(@Param('id') id: string): Promise<Provider> {
    return this.providerService.getProviderById(id);
  }
}
