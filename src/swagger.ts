import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export const swaggerConfigs = <T>(app: INestApplication<T>): OpenAPIObject => {
  const configs = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Athena API')
    .addServer(`http://localhost:${process.env.PORT}`, 'local')
    .build();

  return SwaggerModule.createDocument(app, configs);
};
