import { Field, GraphQLISODateTime, ObjectType } from '@nestjs/graphql';
import { ProductItem } from './product-item';
import { CheckoutResult, Order as IOrder } from '../types';
import { Type } from 'class-transformer';

@ObjectType('Order')
export class Order implements IOrder {
  @Field(() => String)
  orderId: string;

  @Field(() => [ProductItem])
  items: Array<ProductItem>;

  @Field(() => GraphQLISODateTime)
  @Type(() => Date)
  timestamp: Date;

  @Field(() => CheckoutResult)
  checkOut: CheckoutResult;
}
