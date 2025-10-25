"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../core/database/prisma.service");
const shared_types_1 = require("../../../../packages/shared-types/src");
let NotificationsGateway = NotificationsGateway_1 = class NotificationsGateway {
    constructor(jwtService, config, prisma) {
        this.jwtService = jwtService;
        this.config = config;
        this.prisma = prisma;
        this.logger = new common_1.Logger(NotificationsGateway_1.name);
        this.userSockets = new Map(); // userId -> Set of socketIds
    }
    afterInit(server) {
        this.logger.log('WebSocket Gateway initialized');
    }
    async handleConnection(client) {
        try {
            const token = this.extractToken(client);
            if (!token) {
                this.logger.warn(`Client ${client.id} connected without token`);
                client.disconnect();
                return;
            }
            // Verify JWT token
            const secret = this.config.get('JWT_ACCESS_SECRET') ??
                this.config.get('JWT_SECRET') ??
                'change_me';
            const payload = await this.jwtService.verifyAsync(token, { secret });
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
            this.userSockets.get(client.userId).add(client.id);
            this.logger.log(`Client connected: ${client.id} (User: ${client.userId}, Role: ${client.userRole})`);
            // Send unread notifications count
            await this.sendUnreadCount(client);
            // Optionally send recent notifications
            await this.sendRecentNotifications(client);
        }
        catch (error) {
            this.logger.error(`Connection error: ${error?.message}`, error?.stack);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        if (client.userId) {
            const sockets = this.userSockets.get(client.userId);
            if (sockets) {
                sockets.delete(client.id);
                if (sockets.size === 0) {
                    this.userSockets.delete(client.userId);
                }
            }
            this.logger.log(`Client disconnected: ${client.id} (User: ${client.userId})`);
        }
        else {
            this.logger.log(`Client disconnected: ${client.id}`);
        }
    }
    // Subscribe to mark notification as read
    async handleMarkAsRead(data, client) {
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
        }
        catch (error) {
            this.logger.error(`Error marking notification as read: ${error?.message}`);
            return { success: false, error: error?.message };
        }
    }
    // Subscribe to mark all notifications as read
    async handleMarkAllAsRead(client) {
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
        }
        catch (error) {
            this.logger.error(`Error marking all as read: ${error?.message}`);
            return { success: false, error: error?.message };
        }
    }
    // Subscribe to get notifications
    async handleGetNotifications(data, client) {
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
                notifications: notifications.map((n) => this.mapNotification(n)),
            };
        }
        catch (error) {
            this.logger.error(`Error getting notifications: ${error?.message}`);
            return { success: false, error: error?.message };
        }
    }
    // Public methods to emit notifications
    /**
     * Send notification to a specific user
     */
    async notifyUser(userId, notification) {
        try {
            // Create notification in database
            const created = await this.prisma.notification.create({
                data: {
                    type: notification.type,
                    priority: notification.priority ?? shared_types_1.NotificationPriority.MEDIUM,
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
        }
        catch (error) {
            this.logger.error(`Error sending notification to user: ${error?.message}`);
        }
    }
    /**
     * Send notification to a specific role
     */
    async notifyRole(role, notification) {
        try {
            // Create notification in database
            const created = await this.prisma.notification.create({
                data: {
                    type: notification.type,
                    priority: notification.priority ?? shared_types_1.NotificationPriority.MEDIUM,
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
        }
        catch (error) {
            this.logger.error(`Error sending notification to role: ${error?.message}`);
        }
    }
    /**
     * Send notification to all users in a branch
     */
    async notifyBranch(branchId, notification) {
        try {
            // Get all users in the branch
            const users = await this.prisma.user.findMany({
                where: { branchId },
                select: { id: true },
            });
            // Create notifications for each user
            const notifications = await this.prisma.notification.createMany({
                data: users.map((user) => ({
                    type: notification.type,
                    priority: notification.priority ?? shared_types_1.NotificationPriority.MEDIUM,
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
                priority: notification.priority ?? shared_types_1.NotificationPriority.MEDIUM,
                title: notification.title,
                message: notification.message,
                actionUrl: notification.actionUrl,
                actionLabel: notification.actionLabel,
            });
            this.logger.log(`Notification sent to branch ${branchId}: ${notification.title}`);
        }
        catch (error) {
            this.logger.error(`Error sending notification to branch: ${error?.message}`);
        }
    }
    /**
     * Broadcast to all connected users
     */
    async broadcast(notification) {
        try {
            this.server.emit('notification', {
                type: notification.type,
                priority: notification.priority ?? shared_types_1.NotificationPriority.MEDIUM,
                title: notification.title,
                message: notification.message,
                actionUrl: notification.actionUrl,
                actionLabel: notification.actionLabel,
            });
            this.logger.log(`Broadcast notification: ${notification.title}`);
        }
        catch (error) {
            this.logger.error(`Error broadcasting notification: ${error?.message}`);
        }
    }
    // Helper methods
    extractToken(client) {
        // Try to get token from handshake auth
        const authToken = client.handshake.auth?.token;
        if (authToken)
            return authToken;
        // Try to get token from query parameters
        const queryToken = client.handshake.query?.token;
        if (queryToken && typeof queryToken === 'string')
            return queryToken;
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
    async sendUnreadCount(client) {
        if (!client.userId)
            return;
        try {
            const count = await this.prisma.notification.count({
                where: {
                    OR: [{ userId: client.userId }, { userId: null, roleTarget: client.userRole }],
                    isRead: false,
                },
            });
            client.emit('unreadCount', { count });
        }
        catch (error) {
            this.logger.error(`Error sending unread count: ${error?.message}`);
        }
    }
    async sendRecentNotifications(client) {
        if (!client.userId)
            return;
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
                notifications: notifications.map((n) => this.mapNotification(n)),
            });
        }
        catch (error) {
            this.logger.error(`Error sending recent notifications: ${error?.message}`);
        }
    }
    mapNotification(n) {
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
};
exports.NotificationsGateway = NotificationsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('markAsRead'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationsGateway.prototype, "handleMarkAsRead", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('markAllAsRead'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsGateway.prototype, "handleMarkAllAsRead", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('getNotifications'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationsGateway.prototype, "handleGetNotifications", null);
exports.NotificationsGateway = NotificationsGateway = NotificationsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            credentials: true,
        },
        namespace: '/notifications',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        prisma_service_1.PrismaService])
], NotificationsGateway);
//# sourceMappingURL=notifications.gateway.js.map