import { Field, ObjectType } from '@nestjs/graphql';
import { OrderConfirmation as IOrderConfirmation } from '../types';

@ObjectType('OrderConfirmation')
export class OrderConfirmation implements IOrderConfirmation {
  @Field(() => String)
  orderId: string;
}
