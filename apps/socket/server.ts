import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { subscriber, redis } from '@repo/redis';
import * as dotenv from 'dotenv';
import { prisma } from '@repo/db';
import { Queue } from 'bullmq';
import { WhatsappJob } from '@repo/types';

dotenv.config({
    path: '../../.env',
});

const QUEUE_NAME: string = process.env.QUEUE_NAME || 'whatsapp-jobs';
const SOCKET_PORT: number = parseInt(process.env.SOCKET_PORT || '3001', 10);
const NEXTJS_URL: string = process.env.NEXTJS_URL || 'http://localhost:3000';

console.log(process.env.REDIS_HOST);
console.log('NEXTJS_URL:', NEXTJS_URL);

const redisQ = new Queue<WhatsappJob>(QUEUE_NAME, {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        maxRetriesPerRequest: null,
    },
});
const httpServer = createServer();

const io = new Server(httpServer, {
    cors: {
        origin: NEXTJS_URL,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

const socketSubscriptions = new Map<string, Set<string>>();
const channelSubscribers = new Map<string, number>();

subscriber.on('message', (channel: string, message: string) => {
    console.log(`Received message on channel ${channel}: ${message}`);
    io.to(channel.replace('qr:', '')).emit('qr-update', message);
});

export function extractSessionToken(socket: Socket): string | null {
    const authObj = socket.handshake.auth as Record<string, unknown> | undefined;
    const authToken = authObj?.token || authObj?.sessionToken;
    if (typeof authToken === 'string' && authToken.trim()) {
        return authToken.trim();
    }

    const authHeader = socket.handshake.headers?.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7).trim();
    }

    const cookieHeader = socket.handshake.headers?.cookie;
    if (typeof cookieHeader === 'string') {
        const cookies = cookieHeader.split(';').map((c) => c.trim());
        for (const cookie of cookies) {
            const [name, ...rest] = cookie.split('=');
            const val = rest.join('=');
            if (
                name === 'better-auth.session_token' ||
                name === '__Secure-better-auth.session_token' ||
                name === 'session_token'
            ) {
                return decodeURIComponent(val).trim();
            }
        }
    }

    return null;
}

io.use(async (socket: Socket, next) => {
    try {
        const rawToken = extractSessionToken(socket);
        if (!rawToken) {
            return next(new Error('Authentication failed: Missing session token'));
        }

        const token = rawToken.split('.')[0];
        const session = await prisma.session.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!session || !session.user || new Date(session.expiresAt) < new Date()) {
            return next(new Error('Authentication failed: Invalid or expired session'));
        }

        (socket as any).userId = session.userId;
        (socket as any).user = session.user;
        next();
    } catch (error) {
        console.error('Socket authentication error:', error);
        return next(new Error('Authentication failed: Internal server error'));
    }
});

io.on('connection', (socket: Socket) => {
    console.log(`Socket.IO client connected: ${socket.id} (user: ${(socket as any).userId})`);

    socketSubscriptions.set(socket.id, new Set());

    socket.on('subscribe-to-qr', async ({ sessionId }: { sessionId: string }) => {
        try {
            const userId = (socket as any).userId;
            if (!userId) {
                console.error(`Unauthorized subscribe-to-qr attempt from socket: ${socket.id}`);
                socket.emit('qr-update', JSON.stringify({
                    event: 'LOGOUT',
                    error: 'Unauthorized',
                }));
                return;
            }

            const device = await prisma.device.findFirst({
                where: {
                    id: sessionId,
                    userId: userId,
                },
            });

            if (!device || !device.body) {
                console.error(`Device not found or unauthorized for sessionId: ${sessionId}, userId: ${userId}`);
                socket.emit('qr-update', JSON.stringify({
                    event: 'LOGOUT',
                    error: 'Device not found or unauthorized',
                }));
                return;
            }

            const roomId = device.body;
            const channel = `qr:${roomId}`;

            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room: ${roomId}`);

            const socketSubs = socketSubscriptions.get(socket.id);
            if (socketSubs) {
                socketSubs.add(channel);
            }

            const currentCount = channelSubscribers.get(channel) || 0;
            if (currentCount === 0) {
                await subscriber.subscribe(channel);
                console.log(`Subscribed to Redis channel: ${channel}`);
            }
            channelSubscribers.set(channel, currentCount + 1);

            const existingJob = await redisQ.getJob(roomId);
            const shouldCreateJob = !existingJob ||
                await existingJob.isCompleted() ||
                await existingJob.isFailed();

            if (shouldCreateJob) {
                await redisQ.add('connect-whatsapp', {
                    type: 'connect-whatsapp',
                    sender: roomId,
                }, {
                    jobId: roomId,
                    removeOnComplete: true,
                    removeOnFail: false,
                });
                console.log(`Created connect-whatsapp job for device: ${roomId}`);
            } else {
                console.log(`Job already exists for device: ${roomId}, skipping creation`);
            }
        } catch (error) {
            console.error('Error in subscribe-to-qr:', error);
            socket.emit('qr-update', JSON.stringify({
                event: 'LOGOUT',
                error: 'Subscription failed',
            }));
        }
    });

    socket.on('disconnect', async () => {
        console.log(`Socket.IO client disconnected: ${socket.id}`);

        try {
            const channels = socketSubscriptions.get(socket.id);

            if (channels) {
                for (const channel of channels) {
                    const currentCount = channelSubscribers.get(channel) || 0;
                    const newCount = Math.max(0, currentCount - 1);

                    if (newCount === 0) {
                        await subscriber.unsubscribe(channel);
                        channelSubscribers.delete(channel);
                        console.log(`Unsubscribed from Redis channel: ${channel}`);
                    } else {
                        channelSubscribers.set(channel, newCount);
                        console.log(`Channel ${channel} still has ${newCount} subscriber(s)`);
                    }
                }

                socketSubscriptions.delete(socket.id);
            }
        } catch (error) {
            console.error('Error during disconnect cleanup:', error);
        }
    });
});

httpServer.listen(SOCKET_PORT, () => {
    console.log(`✅ Standalone Socket.IO server listening on port ${SOCKET_PORT}`);
});
