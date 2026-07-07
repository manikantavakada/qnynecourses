import { Controller, Get, NotFoundException, Param, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../../common/auth/public.decorator';
import { StreamService } from './stream.service';

@Public()
@Controller('stream/courses')
export class StreamController {
  constructor(private readonly stream: StreamService) {}

  @Get(':courseId/:videoId/*')
  async serve(
    @Param('courseId') courseId: string,
    @Param('videoId') videoId: string,
    @Query('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!token) throw new NotFoundException();
    await this.stream.verifyToken(token, courseId, videoId);
    const file = (req.params as Record<string, string>)[0];
    const key = `courses/${courseId}/${videoId}/${file}`;
    const body = await this.stream.getObject(key);
    if (!body) throw new NotFoundException();
    res.setHeader('content-type', this.stream.contentTypeFor(file));
    res.setHeader('cache-control', 'private, max-age=30');
    (body as NodeJS.ReadableStream).pipe(res);
  }
}
