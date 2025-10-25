import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs/promises'
import { MessageType, prisma } from '@repo/db'
import { MessageService } from '@/lib/messageService'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const to = formData.get('to') as string
    const messageType = formData.get('messageType') as MessageType
    const content = formData.get('content') as string
    const mediaFile = formData.get('media') as File | null
    const sender = formData.get('sender') as string | null

    if (!to || !messageType || !sender) {
      return NextResponse.json({ error: 'Missing required fields: to, messageType, sender' }, { status: 400 })
    }

    let payloadMessage = content
    let inlineMedia: string | undefined

    if (messageType === MessageType.Document || messageType === MessageType.Image || messageType === MessageType.Video) {
      if (!mediaFile) {
        return NextResponse.json({ error: 'Media file is required for media messages' }, { status: 400 })
      }
      const arrayBuffer = await mediaFile.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      inlineMedia = `${mediaFile.type};base64,${base64}`
    }

    const device = await prisma.device.findUnique({ where: { body: sender }, select: { userId: true } })
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    const svc = new MessageService(sender, device.userId)
    await svc.queueSendMessage(to, payloadMessage, inlineMedia)

    return NextResponse.json({ message: 'Message queued successfully' }, { status: 200 })
  } catch (error: any) {
    if (error?.code === 'QUOTA_EXCEEDED') {
      return NextResponse.json({ error: 'Your plan limit is reached. Upgrade your plan or wait for reset.' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
