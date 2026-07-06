import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser, JwtUser } from '../../common/auth/current-user.decorator';
import { Roles } from '../../common/auth/roles.decorator';
import { EnrollUserDto, UpdateMeDto, UpdateUserCourseDto } from './dto';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('users/me')
  me(@CurrentUser() user: JwtUser) {
    return this.users.me(user.sub);
  }

  @Patch('users/me')
  updateMe(@CurrentUser() user: JwtUser, @Body() dto: UpdateMeDto) {
    return this.users.updateMe(user.sub, dto);
  }

  @Roles('ADMIN')
  @Get('admin/users')
  list(@Query('search') search?: string, @Query('purchased') purchased?: string, @Query('page') page?: string) {
    const filter = purchased === undefined ? undefined : purchased === 'true';
    return this.users.listAdmin(search, filter, Number(page ?? 1));
  }

  @Roles('ADMIN')
  @Get('admin/users/:id')
  detail(@Param('id') id: string) {
    return this.users.adminDetail(id);
  }

  @Roles('ADMIN')
  @Patch('admin/user-courses/:id')
  updateUserCourse(@Param('id') id: string, @Body() dto: UpdateUserCourseDto) {
    return this.users.updateUserCourse(id, dto);
  }

  @Roles('ADMIN')
  @Post('admin/users/:userId/enroll')
  enrollUser(@Param('userId') userId: string, @Body() dto: EnrollUserDto) {
    return this.users.enrollUser(userId, dto.courseId, dto.validityDays);
  }
}
