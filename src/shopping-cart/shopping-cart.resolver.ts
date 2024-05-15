import {
  Args,
  Resolver,
  Query,
  Mutation,
  Int,
  registerEnumType,
  Float,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { Order, ProductItem } from './models';
import { ShoppingCartService } from './shopping-cart.service';
import { CheckoutResult } from './types';
import { ProductId } from './types/product-id';
import { plainToInstance } from 'class-transformer';

registerEnumType(CheckoutResult, { name: 'CheckoutResult' });
registerEnumType(ProductId, { name: 'Product' });

@Resolver(() => Order)
export class ShoppingCartResolver {
  constructor(private readonly shoppingCartService: ShoppingCartService) {}

  @Mutation(() => String)
  async initializeCart(
    @Args('userId', { type: () => String }) userId: string,
  ): Promise<string> {
    return this.shoppingCartService.initializeCart(userId);
  }

  @Mutation(() => [ProductItem], { nullable: true })
  async addItemToCart(
    @Args('cartId', { type: () => String }) cartId: string,
    @Args('productId', { type: () => ProductId }) productId: ProductId,
  ): Promise<ProductItem[] | undefined> {
    const order = await this.shoppingCartService.addItemToCart(
      cartId,
      productId,
    );
    return order?.items;
  }

  @Mutation(() => [ProductItem], { nullable: true })
  async removeItemFromCart(
    @Args('cartId', { type: () => String }) cartId: string,
    @Args('productId', { type: () => ProductId }) productId: ProductId,
  ) {
    const order = await this.shoppingCartService.removeItemFromCart(
      cartId,
      productId,
    );
    return order?.items;
  }

  @Mutation(() => [ProductItem], { nullable: true })
  async updateItemQuantityInCart(
    @Args('cartId', { type: () => String }) cartId: string,
    @Args('productId', { type: () => ProductId }) productId: ProductId,
    @Args('quantity', { type: () => Int }) quantity: number,
  ) {
    const order = await this.shoppingCartService.updateItemQuantityInCart(
      cartId,
      productId,
      quantity,
    );
    return order?.items;
  }

  @Mutation(() => Float, { nullable: true })
  async checkout(
    @Args('cartId', { type: () => String }) cartId: string,
  ): Promise<number> {
    const order = await this.shoppingCartService.checkoutOrder(cartId);
    return this.totalPrice(order);
  }

  @Query(() => [ProductItem], { nullable: true })
  async cartContents(@Args('cartId', { type: () => String }) cartId: string) {
    return (await this.shoppingCartService.order(cartId)).items;
  }

  @Query(() => Order, { nullable: true })
  async order(@Args('cartId', { type: () => String }) cartId: string) {
    const order = await this.shoppingCartService.order(cartId);
    return plainToInstance(Order, order);
  }

  @ResolveField(() => Float)
  async totalPrice(@Parent() order: Order) {
    return order.items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0,
    );
  }
}
