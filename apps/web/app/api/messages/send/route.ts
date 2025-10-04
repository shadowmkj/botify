import { NextResponse } from 'next/server';
// import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { Queue } from 'bullmq';
import { redis } from '@repo/redis';
import { MessageType } from '@repo/db';

// const upload = multer({
//   storage: multer.diskStorage({
//     destination: './public/uploads', // Temporary storage for uploaded files
//     filename: (req, file, cb) => {
//       const uniqueSuffix = uuidv4();
//       cb(null, uniqueSuffix + path.extname(file.originalname));
//     },
//   }),
// });

const messageQueue = new Queue('whatsappQueue', { connection: redis });

export async function POST(request: Request) {
  try {
    // Use multer to parse the multipart/form-data
    const formData = await request.formData();

    const to = formData.get('to') as string;
    const messageType = formData.get('messageType') as MessageType;
    const content = formData.get('content') as string;
    const mediaFile = formData.get('media') as File | null;

    if (!to || !messageType) {
      return NextResponse.json({ error: 'Missing required fields: to, messageType' }, { status: 400 });
    }

    let mediaUrl: string | undefined;
    let mediaMimeType: string | undefined;

    if (messageType === MessageType.Document || messageType === MessageType.Image) {
      if (!mediaFile) {
        return NextResponse.json({ error: 'Media file is required for media messages' }, { status: 400 });
      }

      // Save the file to public/uploads
      const arrayBuffer = await mediaFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const uniqueFileName = uuidv4() + path.extname(mediaFile.name);
      const filePath = path.join(process.cwd(), 'public', 'uploads', uniqueFileName);
      await fs.writeFile(filePath, buffer);

      mediaUrl = `/uploads/${uniqueFileName}`; // URL accessible from the web
      mediaMimeType = mediaFile.type;
    }

    // Queue the job for wserver
    await messageQueue.add('send-message', {
      type: 'send-message',
      sender: 'your_sender_number', // TODO: Replace with actual sender number from user session
      receiver: to,
      message: content,
      messageType: messageType,
      mediaUrl: mediaUrl,
      mediaType: mediaMimeType,
    });

    return NextResponse.json({ message: 'Message queued successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
