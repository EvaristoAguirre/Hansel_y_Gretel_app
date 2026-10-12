import { OrderWSListener } from './order-events.listener';
import { BroadcastService } from '../broadcast.service';

describe('OrderWSListener', () => {
  let listener: OrderWSListener;
  let broadcast: jest.Mocked<Pick<BroadcastService, 'broadcast' | 'broadcastToTable'>>;

  const orderWithTable = {
    id: 'order-1',
    table: { id: 'table-1' },
  } as any;

  beforeEach(() => {
    broadcast = {
      broadcast: jest.fn(),
      broadcastToTable: jest.fn(),
    };
    listener = new OrderWSListener(broadcast as unknown as BroadcastService);
  });

  it('emite orderCreated en broadcast global', () => {
    listener.handleOrderCreated({ order: orderWithTable });
    expect(broadcast.broadcast).toHaveBeenCalledWith('orderCreated', orderWithTable);
    expect(broadcast.broadcastToTable).not.toHaveBeenCalled();
  });

  it('emite orderUpdated en broadcast global (no solo a sala)', () => {
    listener.handleOrderUpdated({ order: orderWithTable });
    expect(broadcast.broadcast).toHaveBeenCalledWith('orderUpdated', orderWithTable);
    expect(broadcast.broadcastToTable).not.toHaveBeenCalled();
  });

  it('emite orderDeleted con la orden completa', () => {
    listener.handleOrderDeleted({ order: orderWithTable });
    expect(broadcast.broadcast).toHaveBeenCalledWith('orderDeleted', orderWithTable);
  });

  it('emite orderDeleted con { id } cuando solo llega orderId', () => {
    listener.handleOrderDeleted({ orderId: 'order-only-id' });
    expect(broadcast.broadcast).toHaveBeenCalledWith('orderDeleted', {
      id: 'order-only-id',
    });
  });

  it('emite orderTicketPrinted a la sala de la mesa', () => {
    listener.handleOrderTicketPrinted({ order: orderWithTable });
    expect(broadcast.broadcastToTable).toHaveBeenCalledWith(
      'table-1',
      'orderTicketPrinted',
      orderWithTable,
    );
    expect(broadcast.broadcast).not.toHaveBeenCalled();
  });

  it('emite printerError en broadcast global', () => {
    listener.handleOrderPrinterError({
      order: orderWithTable,
      message: 'Impresora offline',
    });
    expect(broadcast.broadcast).toHaveBeenCalledWith('printerError', {
      order: orderWithTable,
      message: 'Impresora offline',
    });
    expect(broadcast.broadcastToTable).not.toHaveBeenCalled();
  });
});
