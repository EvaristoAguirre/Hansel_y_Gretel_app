import { StockWSListener } from './stock-events.listener';
import { BroadcastService } from '../broadcast.service';
import { StockWsPayload } from 'src/Stock/stock-ws.payload';

describe('StockWSListener', () => {
  let listener: StockWSListener;
  let broadcast: jest.Mocked<Pick<BroadcastService, 'broadcast'>>;

  const payload: StockWsPayload = {
    stocks: [
      { id: 'stock-1', productId: 'prod-1', quantityInStock: 8 },
    ],
  };

  beforeEach(() => {
    broadcast = { broadcast: jest.fn() };
    listener = new StockWSListener(broadcast as unknown as BroadcastService);
  });

  it('reenvía stock.created en broadcast global', () => {
    listener.handleStockCreated(payload);
    expect(broadcast.broadcast).toHaveBeenCalledWith('stock.created', payload);
  });

  it('reenvía stock.updated en broadcast global', () => {
    listener.handleStockUpdated(payload);
    expect(broadcast.broadcast).toHaveBeenCalledWith('stock.updated', payload);
  });

  it('reenvía stock.deducted en broadcast global', () => {
    listener.handleStockDeducted(payload);
    expect(broadcast.broadcast).toHaveBeenCalledWith('stock.deducted', payload);
  });

  it('reenvía stock.restored en broadcast global', () => {
    listener.handleStockRestored(payload);
    expect(broadcast.broadcast).toHaveBeenCalledWith('stock.restored', payload);
  });
});
