import { Product } from 'src/Product/product.entity';

export class PromotionResponse extends Product {
  promotionProducts: {
    id: string;
    quantity: number;
    product: Product;
  }[];
}
