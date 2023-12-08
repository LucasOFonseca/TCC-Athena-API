import { Module } from '@nestjs/common';
import { DisciplineModule } from './discipline/discipline.module';

@Module({
  imports: [DisciplineModule],
})
export class AppModule {}
