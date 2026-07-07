import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { StreamController } from './stream.controller';
import { StreamService } from './stream.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [StreamController],
  providers: [StreamService],
})
export class StreamModule {}
