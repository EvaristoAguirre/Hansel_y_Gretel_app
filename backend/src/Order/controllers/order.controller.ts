import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrderService } from '../services/order.service';
import { CreateOrderDto } from 'src/Order/dtos/create-order.dto';
import { Order } from '../entities/order.entity';
import { UpdateOrderDto } from 'src/Order/dtos/update-order.dto';
import { OrderDetails } from '../entities/order_details.entity';
import { OrderSummaryResponseDto } from 'src/Order/dtos/orderSummaryResponse.dto';
import { RolesGuard } from 'src/Guards/roles.guard';
import { Roles } from 'src/Decorators/roles.decorator';
import { UserRole } from 'src/Enums/roles.enum';
import { CloseOrderDto } from 'src/Order/dtos/close-order.dto';
import { transferOrderData } from 'src/Order/dtos/transfer-order.dto';
import { OrderDetailsDto } from 'src/DTOs/daily-cash-detail.dto';

@ApiTags('Pedido')
@ApiBearerAuth('JWT-auth')
@Controller('order')
@UseGuards(RolesGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('transfer-order/:id')
  @ApiOperation({
    summary: 'Transferir pedido a otra mesa',
    description: 'Transfiere un pedido existente de una mesa a otra',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del pedido a transferir',
  })
  @ApiBody({ type: transferOrderData, description: 'Datos de la mesa destino' })
  @ApiResponse({ status: 200, description: 'Pedido transferido exitosamente' })
  @ApiResponse({ status: 404, description: 'Pedido o mesa no encontrados' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  transferOrder(
    @Param('id') orderId: string,
    @Body() transferOrderData: transferOrderData,
  ): Promise<OrderSummaryResponseDto> {
    return this.orderService.transferOrder(orderId, transferOrderData);
  }

  @Post('open')
  @ApiOperation({
    summary: 'Abrir nuevo pedido',
    description: 'Crea un nuevo pedido asociado a una mesa específica',
  })
  @ApiBody({
    type: CreateOrderDto,
    description: 'Datos del pedido',
    examples: {
      ejemplo: {
        value: {
          tableId: 'uuid-de-la-mesa',
          numberCustomers: 4,
          comment: 'Mesa VIP',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Pedido creado exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'La mesa ya tiene un pedido activo',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  openOrder(
    @Body() openOrder: CreateOrderDto,
  ): Promise<OrderSummaryResponseDto> {
    return this.orderService.openOrder(openOrder);
  }

  @Post('close/:id')
  @ApiOperation({
    summary: 'Cerrar pedido (cobrar)',
    description:
      'Cierra un pedido registrando el método de pago. Requiere rol ADMIN o ENCARGADO.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del pedido a cerrar',
  })
  @ApiBody({
    type: CloseOrderDto,
    description: 'Datos de cierre del pedido',
    examples: {
      efectivo: {
        summary: 'Pago en efectivo',
        value: { paymentMethod: 'EFECTIVO', discount: 0 },
      },
      tarjeta: {
        summary: 'Pago con tarjeta',
        value: { paymentMethod: 'TARJETA', discount: 10 },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Pedido cerrado exitosamente' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  closeOrder(
    @Param('id') id: string,
    @Body() closeOrderDto: CloseOrderDto,
  ): Promise<OrderSummaryResponseDto> {
    return this.orderService.closeOrder(id, closeOrderDto);
  }

  @Post('pending/:id')
  @ApiOperation({
    summary: 'Marcar pedido como pendiente de pago',
    description:
      'Cambia el estado del pedido a pendiente de pago (cliente solicita cuenta)',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID del pedido' })
  @ApiResponse({
    status: 200,
    description: 'Pedido marcado como pendiente de pago',
  })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  markOrderAsPendingPayment(
    @Param('id') id: string,
  ): Promise<OrderSummaryResponseDto> {
    return this.orderService.markOrderAsPendingPayment(id);
  }

  @Patch('update/:id')
  @ApiOperation({
    summary: 'Actualizar pedido',
    description: 'Actualiza los productos/detalles de un pedido abierto',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del pedido a actualizar',
  })
  @ApiBody({
    type: UpdateOrderDto,
    description: 'Datos a actualizar del pedido',
  })
  @ApiResponse({ status: 200, description: 'Pedido actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async updateOrder(
    @Param('id') id: string,
    @Body() updateData: UpdateOrderDto,
  ): Promise<OrderSummaryResponseDto> {
    const order = await this.orderService.updateOrder(id, updateData);
    return order;
  }

  @Post('cancel/:id')
  @ApiOperation({
    summary: 'Cancelar pedido',
    description: 'Cancela un pedido activo. El stock de productos se restaura.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del pedido a cancelar',
  })
  @ApiResponse({ status: 200, description: 'Pedido cancelado exitosamente' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async cancelOrder(@Param('id') id: string): Promise<Order> {
    const result = await this.orderService.cancelOrder(id);
    return result;
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar pedido',
    description: 'Elimina permanentemente un pedido. Solo ADMIN y ENCARGADO.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del pedido a eliminar',
  })
  @ApiResponse({ status: 200, description: 'Pedido eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  deleteOrder(@Param('id') id: string): Promise<string> {
    return this.orderService.deleteOrder(id);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los pedidos',
    description: 'Devuelve una lista paginada de todos los pedidos',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad por página',
    example: 100,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de pedidos obtenida exitosamente',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  getAllOrders(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe)
    limit: number = 100,
  ): Promise<Order[]> {
    return this.orderService.getAllOrders(page, limit);
  }

  @Get('active')
  @ApiOperation({
    summary: 'Obtener pedidos activos',
    description:
      'Devuelve todos los pedidos de mesas abiertas o pendientes de pago',
  })
  @ApiResponse({ status: 200, description: 'Lista de pedidos activos' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  async getOrdersForOpenOrPendingTables(): Promise<Order[]> {
    return await this.orderService.getOrdersForOpenOrPendingTables();
  }

  @Get('order_detail')
  @ApiOperation({
    summary: 'Obtener detalles de pedidos',
    description: 'Devuelve los detalles (productos) de todos los pedidos',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad por página',
  })
  @ApiResponse({ status: 200, description: 'Lista de detalles de pedidos' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  getOrderDetails(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe)
    limit: number = 100,
  ): Promise<OrderDetails[]> {
    return this.orderService.getOrderDetails(page, limit);
  }

  @Get('order-by-id/:id')
  @ApiOperation({
    summary: 'Obtener detalles completos de un pedido',
    description:
      'Devuelve información detallada de un pedido específico para reportes',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID del pedido' })
  @ApiResponse({ status: 200, description: 'Detalles del pedido' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  orderDetailsById(@Param('id') id: string): Promise<OrderDetailsDto> {
    return this.orderService.orderDetailsById(id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener pedido por ID',
    description: 'Devuelve un pedido específico con su resumen',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID del pedido' })
  @ApiResponse({ status: 200, description: 'Pedido encontrado' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.MOZO, UserRole.INVENTARIO)
  getOrderById(@Param('id') id: string): Promise<OrderSummaryResponseDto> {
    return this.orderService.getOrderById(id);
  }
}
