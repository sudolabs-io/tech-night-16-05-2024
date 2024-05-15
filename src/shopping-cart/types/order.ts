import { ProductItem } from './product-item';
import { CheckoutResult } from './checkout-result';

export interface Order {
  orderId: string;
  items: Array<ProductItem>;
  timestamp: Date;
  checkOut: CheckoutResult;
}
