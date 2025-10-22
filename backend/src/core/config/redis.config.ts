import { registerAs } from '@nestjs/config';

function toBool(v?: string): boolean {
  if (!v) return false;
  const s = v.toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'on';
}

export default registerAs('redis', () => ({
  url: process.env.REDIS_URL,
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB ?? '0', 10),
  tls: toBool(process.env.REDIS_TLS),
  keyPrefix: process.env.REDIS_KEY_PREFIX ?? 'zarmind:cache:',
}));