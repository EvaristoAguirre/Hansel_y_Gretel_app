import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from './customer.entity';
import { Repository } from 'typeorm';
import { CreateCustomerDto } from 'src/DTOs/create-customer.dto';
import { UpdateCustomerDto } from 'src/DTOs/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async createCustomer(customer: CreateCustomerDto): Promise<Customer> {
    try {
      return this.customerRepository.save(customer);
    } catch (error) {
      throw new InternalServerErrorException(
        'Error creating the customer.',
        error,
      );
    }
  }

  async updateCustomer(
    id: string,
    updateData: UpdateCustomerDto,
  ): Promise<Customer> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    try {
      const customer = await this.customerRepository.findOne({
        where: { id, isActive: true },
      });
      if (!customer) {
        throw new BadRequestException(`Customer with ID: ${id} not found`);
      }
      Object.assign(customer, updateData);
      return await this.customerRepository.save(customer);
    } catch (error) {
      throw new InternalServerErrorException(
        'Error updating the customer.',
        error,
      );
    }
  }

  async deleteCustomer(id: string): Promise<string> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    try {
      const result = await this.customerRepository.update(id, {
        isActive: false,
      });
      if (result.affected === 0) {
        throw new BadRequestException(`Customer with ID: ${id} not found`);
      }
      return 'Customer successfully deleted';
    } catch (error) {
      throw new InternalServerErrorException(
        'Error deleting the customer.',
        error,
      );
    }
  }

  async getAllCustomers(page: number, limit: number): Promise<Customer[]> {
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }
    try {
      return await this.customerRepository.find({
        where: { isActive: true },
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (error) {
      throw new InternalServerErrorException('Error fetching customers', error);
    }
  }

  async getCustomerById(id: string): Promise<Customer> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    try {
      const customer = await this.customerRepository.findOne({
        where: { id, isActive: true },
      });
      if (!customer) {
        throw new BadRequestException(`Customer with ID: ${id} not found`);
      }
      return customer;
    } catch (error) {
      throw new InternalServerErrorException(
        'Error fetching the customer',
        error,
      );
    }
  }
}
