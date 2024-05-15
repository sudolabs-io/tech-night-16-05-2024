import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ShoppingCartModule } from './shopping-cart/shopping-cart.module';
import { TemporalModule } from 'nestjs-temporal';
import { Connection } from '@temporalio/client';

@Module({
  imports: [
    ShoppingCartModule,
    TemporalModule.registerClientAsync({
      imports: [],
      inject: [],
      useFactory: async () => {
        const connection = await Connection.connect({
          address: 'localhost:7233',
        });
        return { connection };
      },
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
    }),
    ShoppingCartModule,
  ],
})
export class AppModule {}
