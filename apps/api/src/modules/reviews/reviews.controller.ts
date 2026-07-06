import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser, JwtUser } from '../../common/auth/current-user.decorator';
import { Public } from '../../common/auth/public.decorator';
import { ReviewDto } from './dto';
import { ReviewsService } from './reviews.service';

@Controller('courses/:id/reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Public()
  @Get()
  list(@Param('id') id: string) {
    return this.reviews.list(id);
  }

  @Post()
  create(@Param('id') id: string, @CurrentUser() user: JwtUser, @Body() dto: ReviewDto) {
    return this.reviews.create(id, user.sub, dto.rating, dto.comment);
  }
}
