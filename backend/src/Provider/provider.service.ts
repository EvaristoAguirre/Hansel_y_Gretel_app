import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProviderDto } from '../DTOs/create-provider.dto';
import { UpdateProviderDto } from '../DTOs/update-provider.dto';
import { In, Repository } from 'typeorm';
import { Provider } from './provider.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/Product/product.entity';

@Injectable()
export class ProviderService {
  constructor(
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async createProvider(
    createProviderDto: CreateProviderDto,
  ): Promise<Provider> {
    try {
      const provider = await this.providerRepository.save(createProviderDto);

      if (createProviderDto.productsIds) {
        const products = await this.productRepository.findBy({
          id: In(createProviderDto.productsIds),
          isActive: true,
        });

        provider.products = products;
        await this.providerRepository.save(provider);
      }
      return await this.providerRepository.findOne({
        where: { id: provider.id, isActive: true },
        relations: ['products'],
      });
    } catch (error) {
      throw new InternalServerErrorException('Error creating provider', error);
    }
  }

  async updateProvider(
    id: string,
    updateProviderDto: UpdateProviderDto,
  ): Promise<Provider> {
    const { productsIds, ...otherAttributes } = updateProviderDto;
    try {
      const provider = await this.getProviderById(id);
      if (!provider) {
        throw new NotFoundException(`Provider with ID ${id} not found`);
      }
      Object.assign(provider, otherAttributes);
      if (productsIds && productsIds.length > 0) {
        const productsFinded = await this.productRepository.find({
          where: { id: In(productsIds), isActive: true },
        });
        if (productsFinded.length === 0) {
          throw new Error('No valid products found');
        }
        provider.products = productsFinded;
      }
      return await this.providerRepository.save(provider);
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
        relations: ['products'],
      });
    } catch (error) {
      throw new InternalServerErrorException('Error getting providers', error);
    }
  }

  async getProviderById(id: string): Promise<Provider> {
    try {
      const provider = await this.providerRepository.findOne({
        where: { id, isActive: true },
        relations: ['products'],
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
