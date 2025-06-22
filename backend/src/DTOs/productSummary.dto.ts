export interface ProductSummary {
  productId: string;
  productName: string;
  quantity: number;
  unitaryPrice: number;
  subtotal: number;
  allowsToppings?: boolean;
  toppingsIds?: string[];
}

export class ToppingSummaryDto {
  id: string;
  name: string;
}

export class ProductLineDto {
  productId: string;
  productName: string;
  quantity: number;
  unitaryPrice: number;
  subtotal: number;
  allowsToppings: boolean;
  toppings: ToppingSummaryDto[];
  commentOfProduct?: string;
}
