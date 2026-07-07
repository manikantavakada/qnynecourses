import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';
import { UploadModule } from './modules/upload/upload.module';
import { PlaybackModule } from './modules/playback/playback.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { MyCoursesModule } from './modules/my-courses/my-courses.module';
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { AuthGlobalModule } from './common/auth/auth-global.module';
import { HardeningModule } from './modules/hardening/hardening.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { StreamModule } from './modules/stream/stream.module';
import { HealthController } from './modules/health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }]),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.getOrThrow<string>('REDIS_URL') },
      }),
    }),
    PrismaModule,
    AuthGlobalModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    UploadModule,
    PlaybackModule,
    OrdersModule,
    PaymentsModule,
    CouponsModule,
    MyCoursesModule,
    AdminDashboardModule,
    ReviewsModule,
    BlogsModule,
    HardeningModule,
    StreamModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
