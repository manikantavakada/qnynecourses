import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser, JwtUser } from '../../common/auth/current-user.decorator';
import { Public } from '../../common/auth/public.decorator';
import { Roles } from '../../common/auth/roles.decorator';
import { CoursesService } from './courses.service';
import { CourseQueryDto, CreateModuleDto, CreateVideoDto, ReorderModulesDto, UpsertCourseDto, UpdateModuleDto, UpdateVideoDto } from './dto';

@Controller()
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Public()
  @Get('courses')
  list(@Query() query: CourseQueryDto) {
    return this.courses.list(query);
  }

  @Public()
  @Get('courses/:slug')
  detail(@Param('slug') slug: string) {
    return this.courses.detail(slug);
  }

  @Roles('ADMIN')
  @Get('admin/courses')
  adminList(@Query() query: CourseQueryDto) {
    return this.courses.list(query, true);
  }

  @Roles('ADMIN')
  @Post('admin/courses')
  create(@Body() dto: UpsertCourseDto, @CurrentUser() user: JwtUser) {
    return this.courses.create(dto, user.sub);
  }

  @Roles('ADMIN')
  @Patch('admin/courses/:id')
  update(@Param('id') id: string, @Body() dto: Partial<UpsertCourseDto>, @CurrentUser() user: JwtUser) {
    return this.courses.update(id, dto, user.sub);
  }

  @Roles('ADMIN')
  @Delete('admin/courses/:id')
  delete(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.courses.delete(id, user.sub);
  }

  @Roles('ADMIN')
  @Post('admin/courses/:id/modules')
  addModule(@Param('id') id: string, @Body() dto: CreateModuleDto) {
    return this.courses.addModule(id, dto);
  }

  @Roles('ADMIN')
  @Post('admin/courses/modules/reorder')
  reorder(@Body() dto: ReorderModulesDto) {
    return this.courses.reorderModules(dto);
  }

  @Roles('ADMIN')
  @Post('admin/modules/:id/videos')
  addVideo(@Param('id') id: string, @Body() dto: CreateVideoDto) {
    return this.courses.addVideo(id, dto);
  }

  @Roles('ADMIN')
  @Patch('admin/modules/:id')
  updateModule(@Param('id') id: string, @Body() dto: UpdateModuleDto) {
    return this.courses.updateModule(id, dto);
  }

  @Roles('ADMIN')
  @Delete('admin/modules/:id')
  deleteModule(@Param('id') id: string) {
    return this.courses.deleteModule(id);
  }

  @Roles('ADMIN')
  @Patch('admin/videos/:id')
  updateVideo(@Param('id') id: string, @Body() dto: UpdateVideoDto) {
    return this.courses.updateVideo(id, dto);
  }

  @Roles('ADMIN')
  @Delete('admin/videos/:id')
  deleteVideo(@Param('id') id: string) {
    return this.courses.deleteVideo(id);
  }
}
