import { ProductItem } from './models';
import { ProductId } from './types/product-id';

export const taskQueue = 'shopping';

export const products: Record<ProductId, Omit<ProductItem, 'quantity'>> = {
  Ristretto: {
    productId: ProductId.Ristretto,
    name: 'Ristretto from Kongo',
    price: 1,
  },
  Espresso: {
    productId: ProductId.Espresso,
    name: 'Espresso from Columbia',
    price: 1,
  },
  Cappuccino: {
    productId: ProductId.Cappuccino,
    name: 'Cappuccino from Italy',
    price: 2,
  },
};
