import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { Runtime } from '@temporalio/worker';

const temporalLogger = new Logger('Temporal');

const ProxyLogger = {
  log: (...data: unknown[]) => temporalLogger.log(data),
  info: (...data: unknown[]) => temporalLogger.log(data),
  debug: (...data: unknown[]) => {},
  warn: (...data: unknown[]) => temporalLogger.warn(data),
  trace: (...data: unknown[]) => {},
  error: (...data: unknown[]) => temporalLogger.error(data),
};

async function bootstrap() {
  Runtime.install({
    logger: ProxyLogger,
  });
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    credentials: true,
    origin: '*',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      skipMissingProperties: false,
    }),
  );

  await app.listen(4000);
}
void bootstrap();
