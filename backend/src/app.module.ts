import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { Task } from './entities/task.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [Task],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Task]),
  ],
  controllers: [TaskController],
  providers: [TaskService],
})
export class AppModule {}
