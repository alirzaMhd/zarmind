import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Add any custom pre-checks here if needed (e.g., public routes)
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