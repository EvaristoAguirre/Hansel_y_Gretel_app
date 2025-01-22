import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from 'src/DTOs/create-order.dto';
import { Order } from './order.entity';
import { UpdateOrderDto } from 'src/DTOs/update-order.dto';
import { OrderDetails } from './order_details.entity';
import { OrderOpenDto } from 'src/DTOs/create-orderOpen.dto';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('open')
  openOrder(@Body() openOrder: CreateOrderDto): Promise<OrderOpenDto> {
    return this.orderService.openOrder(openOrder);
  }

  @Post()
  createOrder(@Body() order: CreateOrderDto): Promise<Order> {
    return this.orderService.createOrder(order);
  }

  @Patch(':id')
  updateOrder(
    @Param('id') id: string,
    @Body() updateData: UpdateOrderDto,
  ): Promise<Order> {
    return this.orderService.updateOrder(id, updateData);
  }

  @Delete()
  deleteOrder(@Param('id') id: string): Promise<string> {
    return this.orderService.deleteOrder(id);
  }

  @Get()
  getAllOrders(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
  ): Promise<Order[]> {
    return this.orderService.getAllOrders(page, limit);
  }
  @Get('active')
  async getOrdersForOpenOrPendingTables(): Promise<Order[]> {
    return await this.orderService.getOrdersForOpenOrPendingTables();
  }
  @Get('order_detail')
  getOrderDetails(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
  ): Promise<OrderDetails[]> {
    return this.orderService.getOrderDetails(page, limit);
  }

  @Get(':id')
  getOrderById(@Param('id') id: string): Promise<Order> {
    return this.orderService.getOrderById(id);
  }
}
