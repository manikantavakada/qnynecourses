import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailModule } from '../email/email.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [EmailModule, BullModule.registerQueue({ name: 'invoices' })],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
