import { Module } from '@nestjs/common';
import { MyCoursesController } from './my-courses.controller';
import { MyCoursesService } from './my-courses.service';

@Module({ controllers: [MyCoursesController], providers: [MyCoursesService] })
export class MyCoursesModule {}
