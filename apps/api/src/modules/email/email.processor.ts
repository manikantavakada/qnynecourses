import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService, EmailJob } from './email.service';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly email: EmailService) {
    super();
  }

  async process(job: Job<EmailJob>) {
    try {
      await this.email.send(job.data);
    } catch (err) {
      this.logger.error(`Failed to send email job ${job.id} (${job.data.type})`, err instanceof Error ? err.stack : err);
      throw err;
    }
  }
}
