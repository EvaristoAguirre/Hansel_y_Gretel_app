import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderService } from './order.service';

const ORDER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

describe('OrderService.closeOrder factura', () => {
  const orderRepository = { closeOrder: jest.fn() };
  const dailyCashService = {
    getTodayOpenDailyCash: jest.fn().mockResolvedValue({ id: 'cash-1' }),
  };
  const tableService = {
    getTableById: jest.fn().mockResolvedValue({ id: 't1' }),
  };
  const eventEmitter = { emit: jest.fn() };
  const printerService = {
    printTicketOrder: jest.fn(),
    printFiscalTicket: jest.fn().mockResolvedValue('ok'),
  };
  const invoiceService = {
    emitForOrder: jest.fn(),
    fiscalTicket: jest.fn().mockResolvedValue({ afipEnv: 'simulado' }),
  };
  const orderRepo = { findOne: jest.fn() };

  const service = new OrderService(
    orderRepo as any,
    orderRepository as any,
    eventEmitter as unknown as EventEmitter2,
    tableService as any,
    dailyCashService as any,
    {} as any,
    {} as any,
    printerService as any,
    {} as any,
    invoiceService as any,
  );

  const dto = {
    total: 1000,
    payments: [{ amount: 1000, methodOfPayment: 'cash' as const }],
    invoice: true,
    customerEmail: 'a@b.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    dailyCashService.getTodayOpenDailyCash.mockResolvedValue({ id: 'cash-1' });
  });

  it('no cierra la orden si el importe fiscal es cero', async () => {
    orderRepo.findOne.mockResolvedValue({
      id: ORDER_ID,
      orderDetails: [{ isActive: true, subtotal: 0 }],
    });

    await expect(
      service.closeOrder(ORDER_ID, dto as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(orderRepository.closeOrder).not.toHaveBeenCalled();
    expect(invoiceService.emitForOrder).not.toHaveBeenCalled();
  });

  it('cobra primero y después adjunta la factura', async () => {
    orderRepo.findOne.mockResolvedValue({
      id: ORDER_ID,
      orderDetails: [{ isActive: true, subtotal: 1000 }],
    });
    orderRepository.closeOrder.mockResolvedValue({
      id: ORDER_ID,
      table: { id: 't1' },
    });
    invoiceService.emitForOrder.mockResolvedValue({
      id: 'inv-1',
      status: 'authorized',
      cbteNro: 1,
      cae: '00000000000001',
      afipEnv: 'simulado',
      message: 'Factura B autorizada. Número 1.',
    });

    const result = await service.closeOrder(ORDER_ID, dto as any);

    expect(orderRepository.closeOrder).toHaveBeenCalled();
    expect(invoiceService.emitForOrder).toHaveBeenCalledWith(
      ORDER_ID,
      'a@b.com',
    );
    expect(result.invoice?.status).toBe('authorized');
    expect(printerService.printFiscalTicket).toHaveBeenCalled();
    expect(printerService.printTicketOrder).not.toHaveBeenCalled();
  });

  it('si la factura queda pendiente no imprime ticket de cuenta ni fiscal', async () => {
    orderRepo.findOne.mockResolvedValue({
      id: ORDER_ID,
      orderDetails: [{ isActive: true, subtotal: 1000 }],
    });
    orderRepository.closeOrder.mockResolvedValue({
      id: ORDER_ID,
      table: { id: 't1' },
    });
    invoiceService.emitForOrder.mockResolvedValue({
      id: 'inv-2',
      status: 'pending',
      cbteNro: 2,
      cae: null,
      afipEnv: 'simulado',
      message: 'La orden está cobrada. La factura quedó pendiente.',
    });

    await service.closeOrder(ORDER_ID, dto as any);

    expect(printerService.printFiscalTicket).not.toHaveBeenCalled();
    expect(printerService.printTicketOrder).not.toHaveBeenCalled();
  });

  it('con el switch apagado no pide factura', async () => {
    orderRepository.closeOrder.mockResolvedValue({
      id: ORDER_ID,
      table: { id: 't1' },
    });

    const result = await service.closeOrder(ORDER_ID, {
      ...dto,
      invoice: false,
    } as any);

    expect(invoiceService.emitForOrder).not.toHaveBeenCalled();
    expect(result.invoice).toBeUndefined();
  });
});
