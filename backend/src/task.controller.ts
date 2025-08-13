import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { TaskService } from './task.service';
import { Task } from './entities/task.entity';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  findAll(): Promise<Task[]> {
    return this.taskService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Task> {
    return this.taskService.findOne(+id);
  }

  @Post()
  create(@Body() createTaskDto: { title: string }): Promise<Task> {
    return this.taskService.create(createTaskDto.title);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: { completed: boolean }): Promise<Task> {
    return this.taskService.update(+id, updateTaskDto.completed);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.taskService.remove(+id);
  }
}
