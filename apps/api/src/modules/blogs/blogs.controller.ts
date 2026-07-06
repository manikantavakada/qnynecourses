import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser, JwtUser } from '../../common/auth/current-user.decorator';
import { Public } from '../../common/auth/public.decorator';
import { Roles } from '../../common/auth/roles.decorator';
import { BlogsService } from './blogs.service';
import { UpsertBlogDto } from './dto';

@Controller()
export class BlogsController {
  constructor(private readonly blogs: BlogsService) {}

  @Public()
  @Get('blogs')
  list() {
    return this.blogs.list();
  }

  @Public()
  @Get('blogs/:slug')
  detail(@Param('slug') slug: string) {
    return this.blogs.detail(slug);
  }

  @Roles('ADMIN')
  @Get('admin/blogs')
  adminList() {
    return this.blogs.list(true);
  }

  @Roles('ADMIN')
  @Post('admin/blogs')
  create(@Body() dto: UpsertBlogDto, @CurrentUser() user: JwtUser) {
    return this.blogs.create(dto, user.sub);
  }

  @Roles('ADMIN')
  @Patch('admin/blogs/:id')
  update(@Param('id') id: string, @Body() dto: Partial<UpsertBlogDto>) {
    return this.blogs.update(id, dto);
  }

  @Roles('ADMIN')
  @Delete('admin/blogs/:id')
  delete(@Param('id') id: string) {
    return this.blogs.delete(id);
  }
}
