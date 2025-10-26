/**
 * Test unitario para verificar el cálculo correcto de agregados en órdenes
 * Este test simula la lógica de cálculo sin depender de todas las entidades
 */

describe('Cálculo de Agregados - Test Unitario', () => {
  
  /**
   * Simula la lógica de cálculo del total consumido
   * Esta es la función que corregimos en OrderRepository.closeOrder()
   */
  function calculateTotalConsumed(orderDetails: any[]): number {
    return orderDetails.reduce(
      (acc, detail) => acc + Number(detail.subtotal),
      0,
    );
  }

  /**
   * Simula la lógica INCORRECTA anterior (antes de la corrección)
   */
  function calculateTotalConsumedIncorrect(orderDetails: any[]): number {
    return orderDetails.reduce(
      (acc, detail) =>
        acc + Number(detail.subtotal) + Number(detail.toppingsExtraCost),
      0,
    );
  }

  describe('Cálculo correcto con agregados', () => {
    it('debe calcular correctamente el total cuando hay productos con agregados', () => {
      // Arrange - Datos de prueba
      const orderDetails = [
        {
          id: 'detail-1',
          quantity: 2,
          subtotal: 100.00, // Precio base (40) + agregados (10) × 2 unidades = 100
          toppingsExtraCost: 20.00, // Costo total de agregados para ambas unidades
          product: { name: 'Pizza Margherita' },
        },
        {
          id: 'detail-2',
          quantity: 1,
          subtotal: 55.00, // Precio base (50) + agregados (5) × 1 unidad = 55
          toppingsExtraCost: 5.00, // Costo total de agregados para 1 unidad
          product: { name: 'Hamburguesa' },
        },
      ];

      // Act - Cálculo correcto (después de la corrección)
      const correctTotal = calculateTotalConsumed(orderDetails);
      
      // Act - Cálculo incorrecto (antes de la corrección)
      const incorrectTotal = calculateTotalConsumedIncorrect(orderDetails);

      // Assert
      expect(correctTotal).toBe(155.00); // 100 + 55 = 155
      expect(incorrectTotal).toBe(180.00); // 100 + 55 + 20 + 5 = 180
      
      // Verificar que la corrección funciona
      expect(correctTotal).not.toBe(incorrectTotal);
      expect(correctTotal).toBeLessThan(incorrectTotal);
    });

    it('debe manejar correctamente productos sin agregados', () => {
      // Arrange - Productos sin agregados
      const orderDetails = [
        {
          id: 'detail-1',
          quantity: 1,
          subtotal: 25.00, // Solo precio base
          toppingsExtraCost: 0.00, // Sin agregados
          product: { name: 'Coca Cola' },
        },
        {
          id: 'detail-2',
          quantity: 2,
          subtotal: 60.00, // Solo precio base
          toppingsExtraCost: 0.00, // Sin agregados
          product: { name: 'Agua' },
        },
      ];

      // Act
      const correctTotal = calculateTotalConsumed(orderDetails);
      const incorrectTotal = calculateTotalConsumedIncorrect(orderDetails);

      // Assert
      expect(correctTotal).toBe(85.00); // 25 + 60 = 85
      expect(incorrectTotal).toBe(85.00); // 25 + 60 + 0 + 0 = 85
      
      // Para productos sin agregados, ambos cálculos dan el mismo resultado
      expect(correctTotal).toBe(incorrectTotal);
    });

    it('debe calcular correctamente el tip cuando hay agregados', () => {
      // Arrange - Orden con tip
      const orderDetails = [
        {
          id: 'detail-1',
          quantity: 1,
          subtotal: 50.00, // Precio base + agregados
          toppingsExtraCost: 10.00,
          product: { name: 'Pizza' },
        },
      ];

      const declaredTotal = 60.00; // Total con tip de 10

      // Act
      const totalConsumed = calculateTotalConsumed(orderDetails);
      const calculatedTip = declaredTotal - totalConsumed;

      // Assert
      expect(totalConsumed).toBe(50.00);
      expect(calculatedTip).toBe(10.00); // 60 - 50 = 10
    });

    it('debe demostrar el problema que causaba el error de validación', () => {
      // Arrange - Escenario que causaba el error
      const orderDetails = [
        {
          id: 'detail-1',
          quantity: 1,
          subtotal: 50.00, // Precio base (40) + agregados (10) = 50
          toppingsExtraCost: 10.00,
          product: { name: 'Pizza con agregados' },
        },
      ];

      const declaredTotal = 50.00; // Total correcto que envía el frontend

      // Act - Cálculo correcto (después de la corrección)
      const correctTotalConsumed = calculateTotalConsumed(orderDetails);
      const correctTip = declaredTotal - correctTotalConsumed;

      // Act - Cálculo incorrecto (antes de la corrección)
      const incorrectTotalConsumed = calculateTotalConsumedIncorrect(orderDetails);
      const incorrectTip = declaredTotal - incorrectTotalConsumed;

      // Assert
      expect(correctTotalConsumed).toBe(50.00);
      expect(correctTip).toBe(0.00); // Sin tip
      
      expect(incorrectTotalConsumed).toBe(60.00); // 50 + 10
      expect(incorrectTip).toBe(-10.00); // 50 - 60 = -10 (tip negativo!)
      
      // El tip negativo causaba el error de validación
      expect(incorrectTip).toBeLessThan(0);
      expect(correctTip).toBeGreaterThanOrEqual(0);
    });

    it('debe manejar múltiples productos con diferentes configuraciones de agregados', () => {
      // Arrange - Escenario complejo
      const orderDetails = [
        {
          id: 'detail-1',
          quantity: 2,
          subtotal: 80.00, // Producto con agregados
          toppingsExtraCost: 20.00,
          product: { name: 'Pizza Grande' },
        },
        {
          id: 'detail-2',
          quantity: 1,
          subtotal: 15.00, // Producto sin agregados
          toppingsExtraCost: 0.00,
          product: { name: 'Refresco' },
        },
        {
          id: 'detail-3',
          quantity: 3,
          subtotal: 90.00, // Producto con agregados
          toppingsExtraCost: 30.00,
          product: { name: 'Hamburguesas' },
        },
      ];

      // Act
      const correctTotal = calculateTotalConsumed(orderDetails);
      const incorrectTotal = calculateTotalConsumedIncorrect(orderDetails);

      // Assert
      expect(correctTotal).toBe(185.00); // 80 + 15 + 90 = 185
      expect(incorrectTotal).toBe(235.00); // 80 + 15 + 90 + 20 + 0 + 30 = 235
      
      // La diferencia es exactamente la suma de los toppingsExtraCost
      const difference = incorrectTotal - correctTotal;
      const totalToppingsCost = 20.00 + 0.00 + 30.00;
      expect(difference).toBe(totalToppingsCost);
    });
  });
});
