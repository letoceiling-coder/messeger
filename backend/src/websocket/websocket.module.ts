import { Module, forwardRef } from '@nestjs/common';
import { MessagerWebSocketGateway } from './websocket.gateway';
import { MessagesModule } from '../messages/messages.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    forwardRef(() => MessagesModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MessagerWebSocketGateway],
  exports: [MessagerWebSocketGateway],
})
export class WebSocketModule {}
