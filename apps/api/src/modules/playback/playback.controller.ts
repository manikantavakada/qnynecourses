import { Body, Controller, Param, Post } from '@nestjs/common';
import { CurrentUser, JwtUser } from '../../common/auth/current-user.decorator';
import { PlaybackService } from './playback.service';
import { ProgressDto } from './dto';

@Controller('videos')
export class PlaybackController {
  constructor(private readonly playback: PlaybackService) {}

  @Post(':id/play')
  play(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.playback.play(id, user.sub);
  }

  @Post(':id/progress')
  progress(@Param('id') id: string, @CurrentUser() user: JwtUser, @Body() dto: ProgressDto) {
    return this.playback.progress(id, user.sub, dto.watchedSeconds, dto.completed);
  }
}
