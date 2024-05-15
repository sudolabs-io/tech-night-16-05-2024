import { Module } from '@nestjs/common';
import { ShoppingCartService } from './shopping-cart.service';
import { ShoppingCartResolver } from './shopping-cart.resolver';
import { TemporalModule } from 'nestjs-temporal';
import * as path from 'node:path';
import { bundleWorkflowCode } from '@temporalio/worker';
import { taskQueue } from './constants';

@Module({
  imports: [
    TemporalModule.registerWorkerAsync({
      imports: [],
      inject: [],
      useFactory: async () => {
        const workflowBundle = await bundleWorkflowCode({
          workflowsPath: path.join(__dirname, './workflows'),
        });
        return {
          activityClasses: [ShoppingCartService],
          connectionOptions: {
            address: 'localhost:7233',
          },
          workerOptions: {
            taskQueue,
            workflowBundle,
          },
        };
      },
    }),
  ],
  providers: [ShoppingCartService, ShoppingCartResolver],
})
export class ShoppingCartModule {}
