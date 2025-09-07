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
console.log(process.env.REDIS_HOST)
const QUEUE_NAME: string = process.env.QUEUE_NAME || 'whatsapp-jobs';
const SOCKET_PORT: number = parseInt(process.env.SOCKET_PORT || '3001', 10);
const NEXTJS_URL: string = process.env.NEXTJS_URL || 'http://localhost:3000';
const redisQ = new Queue<WhatsappJob>(QUEUE_NAME, {
  connection: redis,
})
const httpServer = createServer();

const io = new Server(httpServer, {
  // CORS configuration to allow connections from your Next.js app
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});


subscriber.on('message', (channel: string, message: string) => {
  console.log(`Received message on channel ${channel}: ${message}`);
  io.to(channel.replace("qr:", "")).emit('qr-update', message);
});

io.on('connection', (socket: Socket) => {
  console.log(`Socket.IO client connected: ${socket.id}`);

  socket.on('subscribe-to-qr', async ({ sessionId }: { sessionId: string }) => {
    const device = await prisma.device.findFirst({
      where: { id: sessionId },
    })
    socket.join(device?.body!);
    const newChannel = `qr:${device?.body}`;
    console.log(`Subscribing to channel: ${newChannel} for sessionId: ${sessionId}`);
    await subscriber.subscribe(newChannel);
    await redisQ.add('connect-whatsapp', {
      type: 'connect-whatsapp',
      sender: device?.body || '',
    })
  });

  socket.on('disconnect', async () => {
    console.log(`Socket.IO client disconnected: ${socket.id}`);
  });
});

httpServer.listen(SOCKET_PORT, () => {
  console.log(`✅ Standalone Socket.IO server listening on port ${SOCKET_PORT}`);
});
