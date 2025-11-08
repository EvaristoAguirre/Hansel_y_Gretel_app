import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from 'src/DTOs/create-order.dto';
import { Order } from './order.entity';
import { UpdateOrderDto } from 'src/DTOs/update-order.dto';
import { OrderDetails } from './order_details.entity';
import { OrderSummaryResponseDto } from 'src/DTOs/orderSummaryResponse.dto';
import { RolesGuard } from 'src/Guards/roles.guard';
import { Roles } from 'src/Decorators/roles.decorator';
import { UserRole } from 'src/Enums/roles.enum';
import { CloseOrderDto } from 'src/DTOs/close-order.dto';
import { transferOrderData } from 'src/DTOs/transfer-order.dto';
import { OrderDetailsDto } from 'src/DTOs/daily-cash-detail.dto';

@Controller('order')
@UseGuards(RolesGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('transfer-order/:id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  transferOrder(
    @Param('id') orderId: string,
    @Body() transferOrderData: transferOrderData,
  ): Promise<OrderSummaryResponseDto> {
    return this.orderService.transferOrder(orderId, transferOrderData);
  }
  @Post('open')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  openOrder(
    @Body() openOrder: CreateOrderDto,
  ): Promise<OrderSummaryResponseDto> {
    return this.orderService.openOrder(openOrder);
  }

  @Post('close/:id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  closeOrder(
    @Param('id') id: string,
    @Body() closeOrderDto: CloseOrderDto,
  ): Promise<OrderSummaryResponseDto> {
    return this.orderService.closeOrder(id, closeOrderDto);
  }

  @Post('pending/:id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  markOrderAsPendingPayment(
    @Param('id') id: string,
  ): Promise<OrderSummaryResponseDto> {
    return this.orderService.markOrderAsPendingPayment(id);
  }

  @Patch('update/:id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async updateOrder(
    @Param('id') id: string,
    @Body() updateData: UpdateOrderDto,
  ): Promise<OrderSummaryResponseDto> {
    const order = await this.orderService.updateOrder(id, updateData);
    return order;
  }
  @Post('cancel/:id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async cancelOrder(@Param('id') id: string): Promise<Order> {
    return await this.orderService.cancelOrder(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  deleteOrder(@Param('id') id: string): Promise<string> {
    return this.orderService.deleteOrder(id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  getAllOrders(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
  ): Promise<Order[]> {
    return this.orderService.getAllOrders(page, limit);
  }
  @Get('active')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async getOrdersForOpenOrPendingTables(): Promise<Order[]> {
    return await this.orderService.getOrdersForOpenOrPendingTables();
  }
  @Get('order_detail')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  getOrderDetails(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
  ): Promise<OrderDetails[]> {
    return this.orderService.getOrderDetails(page, limit);
  }

  @Get('order-by-id/:id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  orderDetailsById(@Param('id') id: string): Promise<OrderDetailsDto> {
    return this.orderService.orderDetailsById(id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  getOrderById(@Param('id') id: string): Promise<OrderSummaryResponseDto> {
    return this.orderService.getOrderById(id);
  }

  // @Post('print')
  // async printerOrder(@Body() orderToPrint: PrinterOrderDto) {
  //   await this.printerService.printerOrder(orderToPrint);
  //   return 'Order printed successfully';
  // }
}
