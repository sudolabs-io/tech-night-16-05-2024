import { ProductId } from './product-id';

export interface ProductItem {
  productId: ProductId;
  name: string;
  price: number;
  quantity: number;
}
