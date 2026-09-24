import { StockService } from './stock.service';

function buildSimpleProduct() {
  return {
    id: 'prod-1',
    name: 'Cafe',
    type: 'simple',
    stock: {
      id: 'stock-1',
      quantityInStock: 10,
      unitOfMeasure: { id: 'uom-stock', abbreviation: 'un' },
    },
  };
}

describe('StockService.deductStock', () => {
  const productService = {
    getProductByIdToAnotherService: jest.fn(),
  };
  const unitOfMeasureService = {
    getUnitOfMeasureUnidad: jest.fn().mockResolvedValue({ id: 'unidad' }),
    convertUnit: jest.fn().mockResolvedValue(2),
  };
  const eventEmitter = { emit: jest.fn() };

  function createService(dataSource: any) {
    return new StockService(
      {} as any,
      eventEmitter as any,
      unitOfMeasureService as any,
      {} as any,
      productService as any,
      {} as any,
      dataSource,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    productService.getProductByIdToAnotherService.mockResolvedValue(
      buildSimpleProduct(),
    );
  });

  it('con QueryRunner externo no commitea y persiste con qr.manager.save', async () => {
    const dataSource = { createQueryRunner: jest.fn() };
    const queryRunner = {
      manager: { save: jest.fn().mockResolvedValue({}) },
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    };
    const service = createService(dataSource);

    await service.deductStock('prod-1', 2, undefined, undefined, queryRunner as any);

    expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    expect(queryRunner.manager.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'stock-1', quantityInStock: 8 }),
    );
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).not.toHaveBeenCalled();
    expect(eventEmitter.emit).toHaveBeenCalledWith('stock.deducted', {
      stockDeducted: true,
    });
  });

  it('sin QueryRunner abre su propia transacción y commitea', async () => {
    const queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: { save: jest.fn().mockResolvedValue({}) },
    };
    const dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };
    const service = createService(dataSource);

    await service.deductStock('prod-1', 2);

    expect(dataSource.createQueryRunner).toHaveBeenCalled();
    expect(queryRunner.startTransaction).toHaveBeenCalled();
    expect(queryRunner.manager.save).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });

  it('sin QueryRunner hace rollback si falla el save', async () => {
    const queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: { save: jest.fn().mockRejectedValue(new Error('stock save failed')) },
    };
    const dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };
    const service = createService(dataSource);

    await expect(service.deductStock('prod-1', 2)).rejects.toThrow(
      'stock save failed',
    );
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });
});
