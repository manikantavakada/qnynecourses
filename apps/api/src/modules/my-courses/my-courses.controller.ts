import { Controller, Get } from '@nestjs/common';
import { CurrentUser, JwtUser } from '../../common/auth/current-user.decorator';
import { MyCoursesService } from './my-courses.service';

@Controller('me')
export class MyCoursesController {
  constructor(private readonly myCourses: MyCoursesService) {}

  @Get('courses')
  courses(@CurrentUser() user: JwtUser) {
    return this.myCourses.courses(user.sub);
  }

  @Get('certificates')
  certificates(@CurrentUser() user: JwtUser) {
    return this.myCourses.certificates(user.sub);
  }
}
