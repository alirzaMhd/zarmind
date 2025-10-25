import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/database/prisma.service';
import { UserRole, NotificationType, NotificationPriority } from '@zarmind/shared-types';
interface AuthenticatedSocket extends Socket {
    userId?: string;
    userRole?: UserRole;
    branchId?: string | null;
}
export declare class NotificationsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly config;
    private readonly prisma;
    server: Server;
    private readonly logger;
    private userSockets;
    constructor(jwtService: JwtService, config: ConfigService, prisma: PrismaService);
    afterInit(server: Server): void;
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): void;
    handleMarkAsRead(data: {
        notificationId: string;
    }, client: AuthenticatedSocket): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleMarkAllAsRead(client: AuthenticatedSocket): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleGetNotifications(data: {
        limit?: number;
        offset?: number;
    }, client: AuthenticatedSocket): Promise<{
        success: boolean;
        notifications: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        notifications?: undefined;
    }>;
    /**
     * Send notification to a specific user
     */
    notifyUser(userId: string, notification: {
        type: NotificationType;
        priority?: NotificationPriority;
        title: string;
        message: string;
        actionUrl?: string;
        actionLabel?: string;
        metadata?: any;
        expiresAt?: Date;
    }): Promise<void>;
    /**
     * Send notification to a specific role
     */
    notifyRole(role: UserRole, notification: {
        type: NotificationType;
        priority?: NotificationPriority;
        title: string;
        message: string;
        actionUrl?: string;
        actionLabel?: string;
        metadata?: any;
        expiresAt?: Date;
    }): Promise<void>;
    /**
     * Send notification to all users in a branch
     */
    notifyBranch(branchId: string, notification: {
        type: NotificationType;
        priority?: NotificationPriority;
        title: string;
        message: string;
        actionUrl?: string;
        actionLabel?: string;
        metadata?: any;
    }): Promise<void>;
    /**
     * Broadcast to all connected users
     */
    broadcast(notification: {
        type: NotificationType;
        priority?: NotificationPriority;
        title: string;
        message: string;
        actionUrl?: string;
        actionLabel?: string;
    }): Promise<void>;
    private extractToken;
    private sendUnreadCount;
    private sendRecentNotifications;
    private mapNotification;
}
export {};
//# sourceMappingURL=notifications.gateway.d.ts.map