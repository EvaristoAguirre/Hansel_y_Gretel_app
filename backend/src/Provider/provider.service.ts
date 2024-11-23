import { Injectable } from '@nestjs/common';
import { CreateProviderDto } from '../DTOs/create-provider.dto';
import { UpdateProviderDto } from '../DTOs/update-provider.dto';
import { Repository } from 'typeorm';
import { Provider } from './provider.entity';

@Injectable()
export class ProviderService {
  constructor(private readonly providerRepository: Repository<Provider>) {}
  async createProvider(
    createProviderDto: CreateProviderDto,
  ): Promise<Provider> {
    return await this.providerRepository.save(createProviderDto);
  }
  async updateProvider(id: string, updateProviderDto: UpdateProviderDto) {
    return await this.providerRepository.update(id, updateProviderDto);
  }
  async deleteProvider(id: string): Promise<string> {
    await this.providerRepository.update(id, { isActive: false });
    return 'Proveedor borrado';
  }

  async getAllProviders(page: number, limit: number): Promise<Provider[]> {
    return await this.providerRepository.find({
      skip: (page - 1) * limit,
      take: limit,
    });
  }
  async getProviderById(id: string): Promise<Provider> {
    return await this.providerRepository.findOne({
      where: { id, isActive: true },
    });
  }
}
