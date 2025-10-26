import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
export interface JwtPayload {
    sub: string;
    email: string;
    role?: string;
    status?: string;
    branchId?: string | null;
    iat?: number;
    exp?: number;
}
export interface AuthenticatedUser {
    userId: string;
    email: string;
    role?: string;
    status?: string;
    branchId?: string | null;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithoutRequest] | [opt: import("passport-jwt").StrategyOptionsWithRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly config;
    constructor(configService: ConfigService);
    validate(payload: JwtPayload): Promise<AuthenticatedUser>;
}
export {};
//# sourceMappingURL=jwt.strategy.d.ts.map