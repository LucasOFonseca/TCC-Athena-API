import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './routes/app.module';
import { swaggerConfigs } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const docs = swaggerConfigs(app);

  SwaggerModule.setup('docs', app, docs);

  await app.listen(process.env.PORT).then(() => {
    console.log(
      `\n🚀 Server \x1b[32mstarted\x1b[0m on port \x1b[1m\x1b[36m${process.env.PORT}\x1b[0m`
    );
  });
}

bootstrap();
