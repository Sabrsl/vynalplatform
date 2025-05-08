import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export async function rateLimit(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  const key = `rate-limit:${ip}`;
  
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, 60); // Expire après 1 minute
    }
    
    const limit = 10; // 10 requêtes par minute
    return {
      success: current <= limit,
      remaining: Math.max(0, limit - current),
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    return { success: true, remaining: 0 }; // En cas d'erreur, on autorise la requête
  }
} 