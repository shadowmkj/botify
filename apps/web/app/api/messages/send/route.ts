import { NextResponse } from 'next/server'
import { MessageType, prisma } from '@repo/db'
import { MessageService } from '@/lib/messageService'
import { verifyApiAccess } from '@/lib/api-auth'
import { PERMISSIONS_MESSAGES_SEND, PERMISSIONS_MESSAGES_SEND_MEDIA } from '@/lib/constants/auth'

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

        // Verify API key based on message type permissions
        const isMedia = messageType === MessageType.Document || messageType === MessageType.Image || messageType === MessageType.Video
        const api = await verifyApiAccess(request, isMedia ? PERMISSIONS_MESSAGES_SEND_MEDIA : PERMISSIONS_MESSAGES_SEND)

        const payloadMessage = content
        let inlineMedia: string | undefined

        if (isMedia) {
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

        // Enforce ownership: API key user must own the device
        if (device.userId !== api.userId) {
            return NextResponse.json({ error: 'API key not authorized for this device' }, { status: 403 })
        }

        const svc = new MessageService(sender, device.userId)
        await svc.queueSendMessage(to, payloadMessage, inlineMedia)

        return NextResponse.json({ message: 'Message queued successfully' }, { status: 200 })
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    } catch (error: any) {
        if (error instanceof Response) {
            return error
        }
        if (error?.code === 'QUOTA_EXCEEDED') {
            return NextResponse.json({ error: 'Your plan limit is reached. Upgrade your plan or wait for reset.' }, { status: 429 })
        }
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }
}
