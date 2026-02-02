import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';
import { SmtpService } from './smtp.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [SmtpService, MailService],
  exports: [MailService],
})
export class MailModule {}
