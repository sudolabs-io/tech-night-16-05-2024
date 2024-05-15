import { Injectable, Logger } from '@nestjs/common';
import { Activities, Activity, InjectTemporalClient } from 'nestjs-temporal';
import { WorkflowClient } from '@temporalio/client';
import { taskQueue } from './constants';
import {
  addItemToCart,
  checkoutOrder,
  getCartContents,
  removeItemFromCart,
  shoppingWorkflow,
  updateItemQuantityInCart,
} from './workflows';
import { Order } from './models';
import { CheckoutResult } from './types';
import * as crypto from 'node:crypto';
import { random } from 'lodash';
import { ProductId } from './types/product-id';

export interface IShoppingCart {
  checkout(props: { order: Order }): Promise<CheckoutResult>;
  notify(props: { userId: string; message: string }): Promise<void>;
  randomUuid(): Promise<string>;
}

@Injectable()
@Activities()
export class ShoppingCartService implements IShoppingCart {
  private readonly logger = new Logger(ShoppingCartService.name);

  constructor(
    @InjectTemporalClient() private readonly client: WorkflowClient,
  ) {}

  private workflowId = (userId: string) => 'wf-shopping-cart' + userId;

  async initializeCart(userId: string) {
    await this.client.start(shoppingWorkflow, {
      args: [{ userId }],
      taskQueue,
      workflowId: this.workflowId(userId),
    });
    this.logger.log(`shopping art for user ${userId} initialized`);
    return userId;
  }

  async order(cartId: string): Promise<Order> {
    try {
      const handle = this.client.getHandle(this.workflowId(cartId));
      return await handle.query(getCartContents);
    } catch {
      this.logger.log(`cartContents. No cart with id: ${cartId}`);
      return undefined;
    }
  }

  async addItemToCart(
    cartId: string,
    productId: ProductId,
  ): Promise<Order | undefined> {
    try {
      const handle = this.client.getHandle(this.workflowId(cartId));
      await handle.signal(addItemToCart, { productId });
      return await this.order(cartId);
    } catch {
      this.logger.log(`addItemToCart. No cart with id: ${cartId}`);
      return undefined;
    }
  }

  async removeItemFromCart(
    cartId: string,
    productId: ProductId,
  ): Promise<Order | undefined> {
    try {
      const handle = this.client.getHandle(this.workflowId(cartId));
      await handle.signal(removeItemFromCart, { productId });
      return await this.order(cartId);
    } catch {
      this.logger.log(`removeItemFromCart. No cart with id: ${cartId}`);
      return undefined;
    }
  }

  async updateItemQuantityInCart(
    cartId: string,
    productId: ProductId,
    quantity: number,
  ): Promise<Order | undefined> {
    try {
      const handle = this.client.getHandle(this.workflowId(cartId));
      await handle.signal(updateItemQuantityInCart, { productId, quantity });
      return await this.order(cartId);
    } catch {
      this.logger.log(`updateItemQuantityInCart. No cart with id: ${cartId}`);
      return undefined;
    }
  }

  async checkoutOrder(cartId: string): Promise<Order | undefined> {
    try {
      const handle = this.client.getHandle(this.workflowId(cartId));
      await handle.signal(checkoutOrder);
      return await this.order(cartId);
    } catch {
      this.logger.log(`updateItemQuantityInCart. No cart with id: ${cartId}`);
      return undefined;
    }
  }

  @Activity()
  randomUuid(): Promise<string> {
    return Promise.resolve(crypto.randomUUID());
  }

  @Activity()
  checkout({ order }: { order: Order }): Promise<CheckoutResult> {
    this.logger.log(`checkout: ${JSON.stringify(order)}`);
    // we are not good at making cappuccino
    const cappuccinoIdx = order.items.findIndex(
      (item) => item.productId === ProductId.Cappuccino,
    );
    if (cappuccinoIdx !== -1) {
      const { quantity } = order.items[cappuccinoIdx];
      const randomNumber = random(0, 100);
      if (randomNumber > 50 - 10 * quantity) {
        this.logger.error(`Sorry, we messed up your cappuccino.`);
        throw new Error(`Sorry, we messed up your cappuccino.`);
      }
    }
    return Promise.resolve(CheckoutResult.Success);
  }
  @Activity()
  notify({
    userId,
    message,
  }: {
    userId: string;
    message: string;
  }): Promise<void> {
    this.logger.log(`notify. userId: ${userId}. - ${message}`);
    return Promise.resolve();
  }
}
