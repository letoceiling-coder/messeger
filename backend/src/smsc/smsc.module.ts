import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmscService } from './smsc.service';
import { MockSmsProvider } from './mock-sms.provider';
import type { ISmsProvider } from './sms-provider.interface';

export const SMS_PROVIDER = 'SMS_PROVIDER';

@Global()
@Module({
  providers: [
    SmscService,
    MockSmsProvider,
    {
      provide: SMS_PROVIDER,
      useFactory: (
        config: ConfigService,
        smsc: SmscService,
        mock: MockSmsProvider,
      ): ISmsProvider => {
        const provider = config.get<string>('SMS_PROVIDER') || 'smsc';
        return provider === 'mock' ? mock : smsc;
      },
      inject: [ConfigService, SmscService, MockSmsProvider],
    },
  ],
  exports: [SmscService, SMS_PROVIDER],
})
export class SmscModule {}
