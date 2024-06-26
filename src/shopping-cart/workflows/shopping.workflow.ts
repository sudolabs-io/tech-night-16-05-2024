import { CheckoutResult, Order, ProductItem } from '../types';
import {
  ActivityFailure,
  defineQuery,
  defineSignal,
  log,
  proxyActivities,
  setHandler,
  condition,
} from '@temporalio/workflow';
import { products } from '../constants';
import { type IShoppingCart } from '../shopping-cart.service';

const { checkout, randomUuid, notify } = proxyActivities<IShoppingCart>({
  startToCloseTimeout: '1 minute',
  retry: { initialInterval: '2 seconds', maximumAttempts: 2 },
});

// Queries
export const getCartContents = defineQuery<Order, []>('getCartContents');

// Signals
export const addItemToCart =
  defineSignal<[Pick<ProductItem, 'productId'>]>('addItemToCart');
export const removeItemFromCart =
  defineSignal<[Pick<ProductItem, 'productId'>]>('removeItemFromCart');
export const updateItemQuantityInCart = defineSignal<
  [Pick<ProductItem, 'productId' | 'quantity'>]
>('updateItemQuantityInCart');
export const checkoutOrder = defineSignal<[]>('checkoutOrder');

export const shoppingWorkflow = async ({ userId }: { userId: string }) => {
  log.info(`Starting shopping for user: ${userId}`);
  const order: Order = {
    orderId: await randomUuid(),
    items: [],
    timestamp: new Date(),
    checkOut: CheckoutResult.Open,
  };

  // queries
  setHandler(getCartContents, () => order);

  // signal handlers
  setHandler(addItemToCart, createAddItemToCartHandler(order));
  setHandler(removeItemFromCart, createRemoveItemFromCartHandler(order));
  setHandler(
    updateItemQuantityInCart,
    createUpdateItemQuantityInCartHandler(order),
  );
  setHandler(checkoutOrder, createCheckoutOrderHandler(order));

  // order notifications
  await handleOrderNotifications(userId, order);

  return order;
};

function createAddItemToCartHandler(order: Order) {
  return ({ productId }) => {
    const product = products[productId];
    if (product) {
      order.items.push({ ...product, quantity: 1 });
      order.timestamp = new Date();
    }
  };
}

function createRemoveItemFromCartHandler(order: Order) {
  return ({ productId }) => {
    order.items = order.items.filter((item) => item.productId !== productId);
    order.timestamp = new Date();
  };
}

function createUpdateItemQuantityInCartHandler(order: Order) {
  return ({ productId, quantity }) => {
    const product = products[productId];
    if (!product) {
      return;
    }
    const existingProductIndex = order.items.findIndex(
      (item) => item.productId === productId,
    );
    if (existingProductIndex !== -1) {
      order.items[existingProductIndex].quantity = quantity;
    } else {
      order.items.push({ ...product, quantity });
    }
    order.timestamp = new Date();
  };
}

function createCheckoutOrderHandler(order: Order) {
  return async () => {
    try {
      order.checkOut = CheckoutResult.Processing;
      order.checkOut = await checkout({ order });
    } catch (e) {
      if (e instanceof ActivityFailure) {
        log.info('checkOut.Activity failed after maximum retry attempts');
        order.checkOut = CheckoutResult.Error;
      } else {
        throw e;
      }
    }
  };
}

async function handleOrderNotifications(userId: string, order: Order) {
  await handleOpenOrder(userId, order);
  await handleCloseOrder(userId, order);
}

async function handleOpenOrder(userId: string, order: Order) {
  await condition(
    () => order.checkOut === CheckoutResult.Processing,
    '15 seconds',
  );
  if (order.checkOut === CheckoutResult.Open) {
    await notify({ userId, message: 'Please, finish your order' });
  }
}

async function handleCloseOrder(userId: string, order: Order) {
  await condition(
    () =>
      ![CheckoutResult.Open, CheckoutResult.Processing].includes(
        order.checkOut,
      ),
    '30 seconds',
  );
  if (order.checkOut === CheckoutResult.Open) {
    await notify({ userId, message: 'Your order was canceled.' });
    order.checkOut = CheckoutResult.Canceled;
  } else {
    // wait for maximum processing time
    await condition(
      () =>
        [CheckoutResult.Success, CheckoutResult.Error].includes(order.checkOut),
      '5 minutes',
    );
    if (order.checkOut === CheckoutResult.Error) {
      await notify({
        userId,
        message: 'Sorry, we are not able to fulfill your order.',
      });
    } else {
      await notify({ userId, message: 'Thank you for your order.' });
    }
  }
}
