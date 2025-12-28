import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient> | null = null;

export const getRedisClient = async () => {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  if (!process.env.REDIS_URL) {
    console.warn('REDIS_URL is not defined. Caching will be disabled.');
    return null;
  }

  redisClient = createClient({
    url: process.env.REDIS_URL,
  });

  redisClient.on('error', (err) => console.error('Redis Client Error', err));

  try {
    await redisClient.connect();
    return redisClient;
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
    redisClient = null; // Reset on failure
    return null;
  }
};
