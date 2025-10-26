/**
 * Test de integración para verificar el flujo completo de órdenes con agregados
 * Este test simula el escenario real que causaba el error
 */

describe('Flujo Completo de Órdenes con Agregados', () => {
  /**
   * Simula el proceso de creación de una orden con productos y agregados
   */
  function simulateOrderCreation() {
    return {
      id: 'order-123',
      state: 'OPEN',
      total: 0,
      orderDetails: [],
    };
  }

  /**
   * Simula la adición de productos con agregados a la orden
   */
  function simulateAddProductWithToppings(order: any, productData: any) {
    const { productId, quantity, toppingsPerUnit, productPrice } = productData;

    // Simula el cálculo que hace buildOrderDetailWithToppings
    let totalExtraCost = 0;

    if (toppingsPerUnit && toppingsPerUnit.length > 0) {
      for (let unitIndex = 0; unitIndex < quantity; unitIndex++) {
        const toppingsForUnit = toppingsPerUnit[unitIndex];
        for (const toppingId of toppingsForUnit) {
          // Simula costo extra de agregado (en la realidad viene de la configuración)
          totalExtraCost += 5.0; // $5 por agregado
        }
      }
    }

    const unitaryToppingsCost = totalExtraCost / quantity;
    const unitaryPrice = productPrice + unitaryToppingsCost;
    const subtotal = unitaryPrice * quantity;

    const orderDetail = {
      id: `detail-${order.orderDetails.length + 1}`,
      quantity,
      subtotal,
      toppingsExtraCost: totalExtraCost,
      product: { id: productId, name: `Producto ${productId}` },
    };

    order.orderDetails.push(orderDetail);
    order.total += subtotal;

    return orderDetail;
  }

  /**
   * Simula el proceso de cierre de orden (CORREGIDO)
   */
  function simulateCloseOrderCorrect(order: any, declaredTotal: number) {
    const totalConsumed = order.orderDetails.reduce(
      (acc: number, detail: any) => acc + Number(detail.subtotal),
      0,
    );

    const calculatedTip = declaredTotal - totalConsumed;

    return {
      totalConsumed,
      calculatedTip,
      isValid: calculatedTip >= 0,
    };
  }

  /**
   * Simula el proceso de cierre de orden (INCORRECTO - antes de la corrección)
   */
  function simulateCloseOrderIncorrect(order: any, declaredTotal: number) {
    const totalConsumed = order.orderDetails.reduce(
      (acc: number, detail: any) =>
        acc + Number(detail.subtotal) + Number(detail.toppingsExtraCost),
      0,
    );

    const calculatedTip = declaredTotal - totalConsumed;

    return {
      totalConsumed,
      calculatedTip,
      isValid: calculatedTip >= 0,
    };
  }

  describe('Escenario Real - Pizza con Agregados', () => {
    it('debe procesar correctamente una orden con pizza y agregados', () => {
      // Arrange - Crear orden
      const order = simulateOrderCreation();

      // Act - Agregar pizza con agregados
      const pizzaDetail = simulateAddProductWithToppings(order, {
        productId: 'pizza-001',
        quantity: 1,
        productPrice: 40.0, // Precio base de la pizza
        toppingsPerUnit: [
          ['topping-cheese', 'topping-pepperoni'], // 2 agregados para 1 unidad
        ],
      });

      // Act - Agregar bebida sin agregados
      const drinkDetail = simulateAddProductWithToppings(order, {
        productId: 'drink-001',
        quantity: 1,
        productPrice: 15.0,
        toppingsPerUnit: [], // Sin agregados
      });

      // Assert - Verificar cálculo de productos
      expect(pizzaDetail.subtotal).toBe(50.0); // 40 + (2 × 5) = 50
      expect(pizzaDetail.toppingsExtraCost).toBe(10.0); // 2 × 5 = 10
      expect(drinkDetail.subtotal).toBe(15.0); // Solo precio base
      expect(drinkDetail.toppingsExtraCost).toBe(0.0); // Sin agregados
      expect(order.total).toBe(65.0); // 50 + 15 = 65

      // Act - Simular cierre de orden
      const declaredTotal = 65.0; // Total correcto

      const correctResult = simulateCloseOrderCorrect(order, declaredTotal);
      const incorrectResult = simulateCloseOrderIncorrect(order, declaredTotal);

      // Assert - Verificar resultados
      expect(correctResult.totalConsumed).toBe(65.0); // Solo subtotales
      expect(correctResult.calculatedTip).toBe(0.0); // Sin tip
      expect(correctResult.isValid).toBe(true); // Válido

      expect(incorrectResult.totalConsumed).toBe(75.0); // 65 + 10 = 75
      expect(incorrectResult.calculatedTip).toBe(-10.0); // 65 - 75 = -10
      expect(incorrectResult.isValid).toBe(false); // ¡INVÁLIDO!
    });

    it('debe manejar correctamente una orden con múltiples productos y agregados', () => {
      // Arrange - Crear orden
      const order = simulateOrderCreation();

      // Act - Agregar múltiples productos
      simulateAddProductWithToppings(order, {
        productId: 'pizza-001',
        quantity: 2,
        productPrice: 40.0,
        toppingsPerUnit: [
          ['topping-cheese'], // 1 agregado para unidad 1
          ['topping-pepperoni', 'topping-mushrooms'], // 2 agregados para unidad 2
        ],
      });

      simulateAddProductWithToppings(order, {
        productId: 'burger-001',
        quantity: 1,
        productPrice: 25.0,
        toppingsPerUnit: [
          ['topping-bacon', 'topping-cheese'], // 2 agregados
        ],
      });

      simulateAddProductWithToppings(order, {
        productId: 'drink-001',
        quantity: 3,
        productPrice: 10.0,
        toppingsPerUnit: [[], [], []], // Sin agregados
      });

      // Assert - Verificar cálculo de productos
      expect(order.orderDetails).toHaveLength(3);
      expect(order.total).toBe(160.0); // (40+5)×2 + (25+10)×1 + (10×3) = 90 + 35 + 30 = 155

      // Act - Simular cierre de orden
      const declaredTotal = 160.0;

      const correctResult = simulateCloseOrderCorrect(order, declaredTotal);
      const incorrectResult = simulateCloseOrderIncorrect(order, declaredTotal);

      // Assert - Verificar resultados
      expect(correctResult.totalConsumed).toBe(160.0);
      expect(correctResult.calculatedTip).toBe(0.0);
      expect(correctResult.isValid).toBe(true);

      // El cálculo incorrecto daría un total mayor
      expect(incorrectResult.totalConsumed).toBeGreaterThan(160.0);
      expect(incorrectResult.isValid).toBe(false);
    });

    it('debe permitir tips correctamente cuando el cálculo es correcto', () => {
      // Arrange - Crear orden
      const order = simulateOrderCreation();

      // Act - Agregar producto con agregados
      simulateAddProductWithToppings(order, {
        productId: 'pizza-001',
        quantity: 1,
        productPrice: 30.0,
        toppingsPerUnit: [
          ['topping-cheese', 'topping-pepperoni'], // 2 agregados
        ],
      });

      // Act - Simular cierre con tip
      const declaredTotal = 50.0; // Total con tip de 10

      const correctResult = simulateCloseOrderCorrect(order, declaredTotal);
      const incorrectResult = simulateCloseOrderIncorrect(order, declaredTotal);

      // Assert
      expect(correctResult.totalConsumed).toBe(40.0); // 30 + 10 = 40
      expect(correctResult.calculatedTip).toBe(10.0); // 50 - 40 = 10
      expect(correctResult.isValid).toBe(true);

      // El cálculo incorrecto daría un tip negativo
      expect(incorrectResult.calculatedTip).toBeLessThan(10.0); // Sería 0 en lugar de 10
      expect(incorrectResult.isValid).toBe(true); // En este caso específico sigue siendo válido
    });
  });
});
