import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

/**
 * Кастомный адаптер Socket.IO с явными настройками heartbeat (ping/pong).
 * Быстрее обнаруживает «мёртвые» соединения (NAT, спящий режим) и освобождает ресурсы.
 */
export class IoAdapterWithPing extends IoAdapter {
  override createIOServer(port: number, options?: ServerOptions): any {
    const pingInterval = parseInt(process.env.SOCKET_PING_INTERVAL || '25000', 10);
    const pingTimeout = parseInt(process.env.SOCKET_PING_TIMEOUT || '20000', 10);

    const server = super.createIOServer(port, {
      ...options,
      pingInterval,
      pingTimeout,
    });
    return server;
  }
}
