import { Product } from 'src/Product/product.entity';

export interface PromotionResponse extends Product {
  promotionProducts: {
    id: string;
    quantity: number;
    product: Product;
  }[];
}
