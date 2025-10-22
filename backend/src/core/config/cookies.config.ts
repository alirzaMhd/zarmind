import { registerAs } from '@nestjs/config';

function toBool(v?: string): boolean {
  if (!v) return false;
  const s = v.toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'on';
}

export default registerAs('cookies', () => {
  const secure =
    toBool(process.env.JWT_COOKIE_SECURE) || (process.env.NODE_ENV === 'production');

  return {
    useCookies: toBool(process.env.AUTH_USE_COOKIES),
    cookieName: process.env.JWT_COOKIE_NAME ?? 'access_token',
    secure,
    sameSite: (process.env.JWT_COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') ?? 'lax',
    domain: process.env.JWT_COOKIE_DOMAIN,
  };
});