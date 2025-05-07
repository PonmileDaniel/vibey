import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: retries => Math.min(retries * 50, 2000),
    connectTimeout: 10000, // Increase timeout to 10 seconds
  }
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('reconnecting', () => {
  console.log('Redis client attempting to reconnect...');
});

await redisClient.connect();

export default redisClient;
