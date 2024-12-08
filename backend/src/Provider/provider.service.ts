import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProviderDto } from '../DTOs/create-provider.dto';
import { UpdateProviderDto } from '../DTOs/update-provider.dto';
import { Repository } from 'typeorm';
import { Provider } from './provider.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ProviderService {
  constructor(
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
  ) {}

  async createProvider(
    createProviderDto: CreateProviderDto,
  ): Promise<Provider> {
    try {
      return await this.providerRepository.save(createProviderDto);
    } catch (error) {
      throw new InternalServerErrorException('Error creating provider', error);
    }
  }

  async updateProvider(id: string, updateProviderDto: UpdateProviderDto) {
    try {
      const provider = await this.getProviderById(id);
      if (!provider) {
        throw new NotFoundException(`Provider with ID ${id} not found`);
      }
      await this.providerRepository.update(id, updateProviderDto);
      return { message: 'Provider successfully updated' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error updating the provider');
    }
  }

  async deleteProvider(id: string): Promise<string> {
    try {
      const provider = await this.getProviderById(id);
      if (!provider) {
        throw new NotFoundException(`Provider with ID ${id} not found`);
      }
      await this.providerRepository.update(id, { isActive: false });
      return 'Provider successfully deleted';
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error deleting the provider');
    }
  }

  async getAllProviders(page: number, limit: number): Promise<Provider[]> {
    try {
      if (page <= 0 || limit <= 0) {
        throw new BadRequestException(
          'Pagination parameters must be greater than zero',
        );
      }
      return await this.providerRepository.find({
        where: { isActive: true },
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (error) {
      throw new InternalServerErrorException('Error getting providers', error);
    }
  }

  async getProviderById(id: string): Promise<Provider> {
    try {
      const provider = await this.providerRepository.findOne({
        where: { id, isActive: true },
      });
      if (!provider) {
        throw new NotFoundException(`Provider with ID ${id} not found`);
      }
      return provider;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error getting the provider');
    }
  }
}
