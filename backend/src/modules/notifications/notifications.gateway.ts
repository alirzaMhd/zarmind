import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/database/prisma.service';
import { UserRole, NotificationType, NotificationPriority } from '@zarmind/shared-types';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: UserRole;
  branchId?: string | null;
}

interface JwtPayload {
  sub: string;
  email: string;
  role?: UserRole;
  branchId?: string | null;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const secret =
        this.config.get<string>('JWT_ACCESS_SECRET') ??
        this.config.get<string>('JWT_SECRET') ??
        'change_me';

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, { secret });

      // Attach user info to socket
      client.userId = payload.sub;
      client.userRole = payload.role;
      client.branchId = payload.branchId ?? null;

      // Join user-specific room
      client.join(`user:${client.userId}`);

      // Join role-specific room
      if (client.userRole) {
        client.join(`role:${client.userRole}`);
      }

      // Join branch-specific room
      if (client.branchId) {
        client.join(`branch:${client.branchId}`);
      }

      // Track user sockets
      if (!this.userSockets.has(client.userId)) {
        this.userSockets.set(client.userId, new Set());
      }
      this.userSockets.get(client.userId)!.add(client.id);

      this.logger.log(
        `Client connected: ${client.id} (User: ${client.userId}, Role: ${client.userRole})`,
      );

      // Send unread notifications count
      await this.sendUnreadCount(client);

      // Optionally send recent notifications
      await this.sendRecentNotifications(client);
    } catch (error: any) {
      this.logger.error(`Connection error: ${error?.message}`, error?.stack);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const sockets = this.userSockets.get(client.userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(client.userId);
        }
      }
      this.logger.log(`Client disconnected: ${client.id} (User: ${client.userId})`);
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  // Subscribe to mark notification as read
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        return { success: false, error: 'Unauthorized' };
      }

      const notification = await this.prisma.notification.findUnique({
        where: { id: data.notificationId },
      });

      if (!notification) {
        return { success: false, error: 'Notification not found' };
      }

      // Check if user has access to this notification
      if (notification.userId && notification.userId !== client.userId) {
        return { success: false, error: 'Access denied' };
      }

      // Mark as read
      await this.prisma.notification.update({
        where: { id: data.notificationId },
        data: { isRead: true, readAt: new Date() },
      });

      // Send updated unread count
      await this.sendUnreadCount(client);

      return { success: true };
    } catch (error: any) {
      this.logger.error(`Error marking notification as read: ${error?.message}`);
      return { success: false, error: error?.message };
    }
  }

  // Subscribe to mark all notifications as read
  @SubscribeMessage('markAllAsRead')
  async handleMarkAllAsRead(@ConnectedSocket() client: AuthenticatedSocket) {
    try {
      if (!client.userId) {
        return { success: false, error: 'Unauthorized' };
      }

      await this.prisma.notification.updateMany({
        where: {
          userId: client.userId,
          isRead: false,
        },
        data: { isRead: true, readAt: new Date() },
      });

      // Send updated unread count
      await this.sendUnreadCount(client);

      return { success: true };
    } catch (error: any) {
      this.logger.error(`Error marking all as read: ${error?.message}`);
      return { success: false, error: error?.message };
    }
  }

  // Subscribe to get notifications
  @SubscribeMessage('getNotifications')
  async handleGetNotifications(
    @MessageBody() data: { limit?: number; offset?: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        return { success: false, error: 'Unauthorized' };
      }

      const limit = data.limit ?? 20;
      const offset = data.offset ?? 0;

      const notifications = await this.prisma.notification.findMany({
        where: {
          OR: [{ userId: client.userId }, { userId: null, roleTarget: client.userRole }],
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return {
        success: true,
        notifications: notifications.map((n: any) => this.mapNotification(n)),
      };
    } catch (error: any) {
      this.logger.error(`Error getting notifications: ${error?.message}`);
      return { success: false, error: error?.message };
    }
  }

  // Public methods to emit notifications

  /**
   * Send notification to a specific user
   */
  async notifyUser(
    userId: string,
    notification: {
      type: NotificationType;
      priority?: NotificationPriority;
      title: string;
      message: string;
      actionUrl?: string;
      actionLabel?: string;
      metadata?: any;
      expiresAt?: Date;
    },
  ) {
    try {
      // Create notification in database
      const created = await this.prisma.notification.create({
        data: {
          type: notification.type,
          priority: notification.priority ?? NotificationPriority.MEDIUM,
          title: notification.title,
          message: notification.message,
          userId,
          actionUrl: notification.actionUrl ?? null,
          actionLabel: notification.actionLabel ?? null,
          metadata: notification.metadata ?? null,
          expiresAt: notification.expiresAt ?? null,
        },
      });

      // Emit to user's room
      this.server.to(`user:${userId}`).emit('notification', this.mapNotification(created));

      this.logger.log(`Notification sent to user ${userId}: ${notification.title}`);
    } catch (error: any) {
      this.logger.error(`Error sending notification to user: ${error?.message}`);
    }
  }

  /**
   * Send notification to a specific role
   */
  async notifyRole(
    role: UserRole,
    notification: {
      type: NotificationType;
      priority?: NotificationPriority;
      title: string;
      message: string;
      actionUrl?: string;
      actionLabel?: string;
      metadata?: any;
      expiresAt?: Date;
    },
  ) {
    try {
      // Create notification in database
      const created = await this.prisma.notification.create({
        data: {
          type: notification.type,
          priority: notification.priority ?? NotificationPriority.MEDIUM,
          title: notification.title,
          message: notification.message,
          roleTarget: role,
          actionUrl: notification.actionUrl ?? null,
          actionLabel: notification.actionLabel ?? null,
          metadata: notification.metadata ?? null,
          expiresAt: notification.expiresAt ?? null,
        },
      });

      // Emit to role's room
      this.server.to(`role:${role}`).emit('notification', this.mapNotification(created));

      this.logger.log(`Notification sent to role ${role}: ${notification.title}`);
    } catch (error: any) {
      this.logger.error(`Error sending notification to role: ${error?.message}`);
    }
  }

  /**
   * Send notification to all users in a branch
   */
  async notifyBranch(
    branchId: string,
    notification: {
      type: NotificationType;
      priority?: NotificationPriority;
      title: string;
      message: string;
      actionUrl?: string;
      actionLabel?: string;
      metadata?: any;
    },
  ) {
    try {
      // Get all users in the branch
      const users = await this.prisma.user.findMany({
        where: { branchId },
        select: { id: true },
      });

      // Create notifications for each user
      const notifications = await this.prisma.notification.createMany({
        data: users.map((user: any) => ({
          type: notification.type,
          priority: notification.priority ?? NotificationPriority.MEDIUM,
          title: notification.title,
          message: notification.message,
          userId: user.id,
          actionUrl: notification.actionUrl ?? null,
          actionLabel: notification.actionLabel ?? null,
          metadata: notification.metadata ?? null,
        })),
      });

      // Emit to branch's room
      this.server.to(`branch:${branchId}`).emit('notification', {
        type: notification.type,
        priority: notification.priority ?? NotificationPriority.MEDIUM,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
        actionLabel: notification.actionLabel,
      });

      this.logger.log(`Notification sent to branch ${branchId}: ${notification.title}`);
    } catch (error: any) {
      this.logger.error(`Error sending notification to branch: ${error?.message}`);
    }
  }

  /**
   * Broadcast to all connected users
   */
  async broadcast(notification: {
    type: NotificationType;
    priority?: NotificationPriority;
    title: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
  }) {
    try {
      this.server.emit('notification', {
        type: notification.type,
        priority: notification.priority ?? NotificationPriority.MEDIUM,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
        actionLabel: notification.actionLabel,
      });

      this.logger.log(`Broadcast notification: ${notification.title}`);
    } catch (error: any) {
      this.logger.error(`Error broadcasting notification: ${error?.message}`);
    }
  }

  // Helper methods

  private extractToken(client: Socket): string | null {
    // Try to get token from handshake auth
    const authToken = client.handshake.auth?.token;
    if (authToken) return authToken;

    // Try to get token from query parameters
    const queryToken = client.handshake.query?.token;
    if (queryToken && typeof queryToken === 'string') return queryToken;

    // Try to get token from headers
    const headerToken = client.handshake.headers?.authorization;
    if (headerToken) {
      const parts = headerToken.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        return parts[1];
      }
    }

    return null;
  }

  private async sendUnreadCount(client: AuthenticatedSocket) {
    if (!client.userId) return;

    try {
      const count = await this.prisma.notification.count({
        where: {
          OR: [{ userId: client.userId }, { userId: null, roleTarget: client.userRole }],
          isRead: false,
        },
      });

      client.emit('unreadCount', { count });
    } catch (error: any) {
      this.logger.error(`Error sending unread count: ${error?.message}`);
    }
  }

  private async sendRecentNotifications(client: AuthenticatedSocket) {
    if (!client.userId) return;

    try {
      const notifications = await this.prisma.notification.findMany({
        where: {
          OR: [{ userId: client.userId }, { userId: null, roleTarget: client.userRole }],
          isRead: false,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      client.emit('recentNotifications', {
        notifications: notifications.map((n: any) => this.mapNotification(n)),
      });
    } catch (error: any) {
      this.logger.error(`Error sending recent notifications: ${error?.message}`);
    }
  }

  private mapNotification(n: any) {
    return {
      id: n.id,
      type: n.type,
      priority: n.priority,
      title: n.title,
      message: n.message,
      userId: n.userId,
      roleTarget: n.roleTarget,
      isRead: n.isRead,
      readAt: n.readAt,
      actionUrl: n.actionUrl,
      actionLabel: n.actionLabel,
      metadata: n.metadata,
      expiresAt: n.expiresAt,
      createdAt: n.createdAt,
    };
  }
}