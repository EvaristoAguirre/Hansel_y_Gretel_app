import { Controller } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from 'src/DTOs/create-customer.dto';
import { UpdateCustomerDto } from 'src/DTOs/update-customer.dto';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  async createCustomer(customer: CreateCustomerDto): Promise<Customer> {
    return this.customerService.createCustomer(customer);
  }

  async updateCustomer(
    id: string,
    updateData: UpdateCustomerDto,
  ): Promise<Customer> {
    return this.customerService.updateCustomer(id, updateData);
  }

  async deleteCustomer(id: string): Promise<string> {
    return this.customerService.deleteCustomer(id);
  }

  async getAllCustomers(page: number, limit: number): Promise<Customer[]> {
    return this.customerService.getAllCustomers(page, limit);
  }

  async getCustomerById(id: string): Promise<Customer> {
    return this.customerService.getCustomerById(id);
  }
}
