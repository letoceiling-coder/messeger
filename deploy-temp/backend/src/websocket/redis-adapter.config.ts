import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Server } from 'socket.io';

export async function setupRedisAdapter(io: Server): Promise<void> {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));

    console.log('Redis adapter configured successfully');
  } catch (error) {
    console.warn('Redis not available, using default adapter:', error.message);
    // Продолжаем работу без Redis (для разработки)
  }
}
