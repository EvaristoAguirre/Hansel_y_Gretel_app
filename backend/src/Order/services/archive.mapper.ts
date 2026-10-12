export interface ArchiveSourceTopping {
  topping?: { id?: string | null; name?: string | null } | null;
  unitOfMeasureName?: string | null;
  unitIndex?: number | null;
  extraCost?: unknown;
}

export interface ArchiveSourcePromotion {
  slotId: string;
  slot?: { name?: string | null } | null;
  selectedProductId: string;
  selectedProduct?: { name?: string | null } | null;
  extraCostApplied?: unknown;
}

export interface ArchiveSourceDetail {
  id: string;
  quantity: number;
  unitaryPrice: unknown;
  toppingsExtraCost: unknown;
  subtotal: unknown;
  isActive?: boolean | null;
  commentOfProduct?: string | null;
  commandNumber?: string | null;
  product?: {
    id?: string | null;
    name?: string | null;
    code?: number | null;
    categories?: Array<{ name?: string | null }> | null;
  } | null;
  orderDetailToppings?: ArchiveSourceTopping[] | null;
  promotionSelections?: ArchiveSourcePromotion[] | null;
}

export interface ArchiveSourceOrder {
  id: string;
  date: Date;
  state: string;
  total: unknown;
  tip: unknown;
  discountPercent: unknown;
  discountAmount: unknown;
  numberCustomers: number | null;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  table?: {
    id: string;
    name?: string | null;
    room?: { name?: string | null } | null;
  } | null;
  dailyCash?: { id: string; date?: Date | null } | null;
  payments?: Array<{
    id: string;
    amount: unknown;
    methodOfPayment: string;
    createdAt: Date;
  }> | null;
  orderDetails?: ArchiveSourceDetail[] | null;
}

export interface ArchivedOrderSnapshot {
  id: string;
  date: Date;
  state: string;
  total: number;
  tip: number;
  discountPercent: number;
  discountAmount: number;
  numberCustomers: number | null;
  comment: string | null;
  commandNumber: null;
  methodOfPayment: string | null;
  tableId: string | null;
  dailyCashId: string | null;
  tableName: string | null;
  roomName: string | null;
  dailyCashDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  archivedAt: Date;
  snapshotSource: 'archive';
  orderDetails: Array<Record<string, unknown>>;
  payments: Array<{
    id: string;
    amount: number;
    methodOfPayment: string;
    createdAt: Date;
  }>;
}

export interface ArchiveInsertPlan {
  nullProductDetailIds: string[];
  warnings: string[];
  headerParams: unknown[];
  detailParams: unknown[][];
  paymentParams: unknown[][];
  snapshot: ArchivedOrderSnapshot;
}

export function buildArchiveInserts(
  order: ArchiveSourceOrder,
  archivedAt: Date,
): ArchiveInsertPlan {
  const payments = order.payments ?? [];
  const details = order.orderDetails ?? [];
  const nullProductDetailIds = details
    .filter((detail) => !detail.product?.id)
    .map((detail) => detail.id);

  const warnings: string[] = [];
  const paid = payments.reduce(
    (sum, payment) => sum + money(payment.amount),
    0,
  );
  if (Math.abs(paid - money(order.total)) > 0.009) {
    warnings.push(
      `[ARCHIVE] orderId=${order.id} descuadre de pagos total=${money(order.total)} pagos=${paid.toFixed(2)}`,
    );
  }

  const mappedDetails = details.map((detail) => {
    const toppings =
      detail.orderDetailToppings?.map((topping) => ({
        toppingId: topping.topping?.id ?? null,
        toppingName: topping.topping?.name ?? null,
        unitOfMeasureName: topping.unitOfMeasureName ?? null,
        unitIndex: topping.unitIndex ?? null,
        extraCost: money(topping.extraCost),
      })) ?? [];
    if (money(detail.toppingsExtraCost) > 0 && toppings.length === 0) {
      warnings.push(
        `[ARCHIVE] orderId=${order.id} detailId=${detail.id} toppingsExtraCost sin composición`,
      );
    }
    const promotions =
      detail.promotionSelections?.map((selection) => ({
        slotId: selection.slotId,
        slotName: selection.slot?.name ?? null,
        selectedProductId: selection.selectedProductId,
        selectedProductName: selection.selectedProduct?.name ?? null,
        extraCostApplied: money(selection.extraCostApplied),
      })) ?? [];
    const categoryNames = (detail.product?.categories ?? [])
      .map((category) => category.name)
      .filter((name): name is string => Boolean(name));

    return {
      params: [
        detail.id,
        detail.quantity,
        money(detail.unitaryPrice),
        money(detail.toppingsExtraCost),
        money(detail.subtotal),
        detail.product?.id ?? null,
        detail.commandNumber ?? null,
        detail.isActive ?? true,
        JSON.stringify(toppings),
        JSON.stringify(promotions),
        detail.product?.name ?? null,
        detail.product?.code ?? null,
        JSON.stringify(categoryNames),
        detail.commentOfProduct ?? null,
        'archive',
        order.id,
      ],
      snapshot: {
        id: detail.id,
        quantity: detail.quantity,
        unitaryPrice: money(detail.unitaryPrice),
        toppingsExtraCost: money(detail.toppingsExtraCost),
        subtotal: money(detail.subtotal),
        productId: detail.product?.id ?? null,
        commandNumber: detail.commandNumber ?? null,
        isActive: detail.isActive ?? true,
        toppings,
        promotionSelections: promotions,
        productName: detail.product?.name ?? null,
        productCode: detail.product?.code ?? null,
        categoryNames,
        commentOfProduct: detail.commentOfProduct ?? null,
        snapshotSource: 'archive',
      },
    };
  });

  const methodOfPayment =
    payments.length === 1 ? payments[0].methodOfPayment : null;
  const snapshotPayments = payments.map((payment) => ({
    id: payment.id,
    amount: money(payment.amount),
    methodOfPayment: payment.methodOfPayment,
    createdAt: payment.createdAt,
  }));

  const snapshot: ArchivedOrderSnapshot = {
    id: order.id,
    date: order.date,
    state: order.state,
    total: money(order.total),
    tip: money(order.tip),
    discountPercent: money(order.discountPercent),
    discountAmount: money(order.discountAmount),
    numberCustomers: order.numberCustomers,
    comment: order.comment,
    commandNumber: null,
    methodOfPayment,
    tableId: order.table?.id ?? null,
    dailyCashId: order.dailyCash?.id ?? null,
    tableName: order.table?.name ?? null,
    roomName: order.table?.room?.name ?? null,
    dailyCashDate: order.dailyCash?.date ?? null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    closedAt: order.closedAt,
    archivedAt,
    snapshotSource: 'archive',
    orderDetails: mappedDetails.map((detail) => detail.snapshot),
    payments: snapshotPayments,
  };

  return {
    nullProductDetailIds,
    warnings,
    headerParams: [
      order.id,
      order.date,
      order.state,
      money(order.total),
      money(order.tip),
      money(order.discountPercent),
      money(order.discountAmount),
      order.numberCustomers,
      order.comment,
      null,
      methodOfPayment,
      order.table?.id ?? null,
      order.dailyCash?.id ?? null,
      order.createdAt,
      order.updatedAt,
      order.closedAt,
      order.table?.name ?? null,
      order.table?.room?.name ?? null,
      order.dailyCash?.date ?? null,
      archivedAt,
      'archive',
    ],
    detailParams: mappedDetails.map((detail) => detail.params),
    paymentParams: snapshotPayments.map((payment) => [
      payment.id,
      payment.amount,
      payment.methodOfPayment,
      payment.createdAt,
      order.id,
    ]),
    snapshot,
  };
}

function money(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
