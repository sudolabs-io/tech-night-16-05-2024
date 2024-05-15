import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ProductItem as IProductItem } from '../types';
import { ProductId } from '../types/product-id';

@ObjectType('ProductItem')
export class ProductItem implements IProductItem {
  @Field(() => ProductId)
  productId: ProductId;

  @Field(() => String)
  name: string;

  @Field(() => Float)
  price: number;

  @Field(() => Int)
  quantity: number;
}
