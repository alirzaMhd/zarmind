import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../guards/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if route is marked as @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true; // Skip authentication for @Public() routes
    }

    return super.canActivate(context) as any;
  }

  handleRequest(err: any, user: any, info?: any) {
    if (err) {
      throw err;
    }

    if (!user) {
      // info can be a Jwt error from passport-jwt
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('JWT token has expired');
      }
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid JWT token');
      }
      throw new UnauthorizedException('Unauthorized');
    }

    // Optional: ensure user is active (depends on your JwtStrategy validate return)
    if (user?.status && user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is not active');
    }

    return user;
  }
}