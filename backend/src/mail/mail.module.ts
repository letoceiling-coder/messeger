import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SmtpService } from './smtp.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [SmtpService],
  exports: [SmtpService],
})
export class MailModule {}
