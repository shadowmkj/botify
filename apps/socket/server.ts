import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { subscriber, redis } from '@repo/redis'; // Ensure you have the correct path to your redis module
import * as dotenv from 'dotenv';
import { prisma } from "@repo/db"
import { Queue } from 'bullmq'; // Ensure you have bullmq installed
import { WhatsappJob } from '@repo/types';
dotenv.config({
    path: '../../.env'
}); // Load environment variables from .env file

const QUEUE_NAME: string = process.env.QUEUE_NAME || 'whatsapp-jobs';
const SOCKET_PORT: number = parseInt(process.env.SOCKET_PORT || '3001', 10);
const NEXTJS_URL: string = process.env.NEXTJS_URL || 'http://localhost:3000';

console.log(process.env.REDIS_HOST)
console.log("NEXTJS_URL:", NEXTJS_URL);

const redisQ = new Queue<WhatsappJob>(QUEUE_NAME, {
    connection: {
        host: "localhost",
        port: 6379,
        maxRetriesPerRequest: null
    },
})
const httpServer = createServer();

const io = new Server(httpServer, {
    cors: {
        origin: NEXTJS_URL,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Track subscriptions per socket to enable proper cleanup
const socketSubscriptions = new Map<string, Set<string>>();
// Track active subscribers count per channel to avoid duplicate subscriptions
const channelSubscribers = new Map<string, number>();

subscriber.on('message', (channel: string, message: string) => {
    console.log(`Received message on channel ${channel}: ${message}`);
    io.to(channel.replace("qr:", "")).emit('qr-update', message);
});

io.on('connection', (socket: Socket) => {
    console.log(`Socket.IO client connected: ${socket.id}`);
    
    // Initialize subscription tracking for this socket
    socketSubscriptions.set(socket.id, new Set());

    socket.on('subscribe-to-qr', async ({ sessionId }: { sessionId: string }) => {
        try {
            const device = await prisma.device.findFirst({
                where: { id: sessionId },
            });

            if (!device || !device.body) {
                console.error(`Device not found for sessionId: ${sessionId}`);
                socket.emit('qr-update', JSON.stringify({ 
                    event: 'LOGOUT', 
                    error: 'Device not found' 
                }));
                return;
            }

            const roomId = device.body;
            const channel = `qr:${roomId}`;
            
            // Join socket room
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room: ${roomId}`);

            // Track this subscription for cleanup later
            const socketSubs = socketSubscriptions.get(socket.id);
            if (socketSubs) {
                socketSubs.add(channel);
            }

            // Subscribe to Redis channel only if not already subscribed
            const currentCount = channelSubscribers.get(channel) || 0;
            if (currentCount === 0) {
                await subscriber.subscribe(channel);
                console.log(`Subscribed to Redis channel: ${channel}`);
            }
            channelSubscribers.set(channel, currentCount + 1);

            // Check if job already exists before creating a new one
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
                error: 'Subscription failed' 
            }));
        }
    });

    socket.on('disconnect', async () => {
        console.log(`Socket.IO client disconnected: ${socket.id}`);
        
        try {
            // Get all channels this socket was subscribed to
            const channels = socketSubscriptions.get(socket.id);
            
            if (channels) {
                for (const channel of channels) {
                    // Decrease subscriber count for this channel
                    const currentCount = channelSubscribers.get(channel) || 0;
                    const newCount = Math.max(0, currentCount - 1);
                    
                    if (newCount === 0) {
                        // No more subscribers for this channel, unsubscribe from Redis
                        await subscriber.unsubscribe(channel);
                        channelSubscribers.delete(channel);
                        console.log(`Unsubscribed from Redis channel: ${channel}`);
                    } else {
                        channelSubscribers.set(channel, newCount);
                        console.log(`Channel ${channel} still has ${newCount} subscriber(s)`);
                    }
                }
                
                // Clean up socket's subscription tracking
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
