import { NextResponse } from 'next/server'
import { MessageType, prisma } from '@repo/db'
import { MessageService } from '@/lib/messageService'
import { verifyApiAccess } from '@/lib/api-auth'
import { PERMISSIONS_MESSAGES_SEND, PERMISSIONS_MESSAGES_SEND_MEDIA } from '@/lib/constants/auth'
import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

function getStorageDir() {
    const raw = process.env.MEDIA_STORAGE_DIR
    if (raw && path.isAbsolute(raw)) return raw
    if (raw) return path.resolve(process.cwd(), raw)
    // default to Next public directory so files are served statically
    return path.join(process.cwd(), 'public', 'media')
}

async function ensureDir(dir: string) {
    await fs.mkdir(dir, { recursive: true })
}

const mapMessageTypeToMedia = (t: MessageType): 'image' | 'video' | 'document' => {
    if (t === MessageType.Image) return 'image'
    if (t === MessageType.Video) return 'video'
    return 'document'
}

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

        const payloadMessage = content || ''
        let mediaUrl: string | undefined
        let fileName: string | undefined
        let mimeType: string | undefined

        if (isMedia) {
            if (!mediaFile) {
                return NextResponse.json({ error: 'Media file is required for media messages' }, { status: 400 })
            }

            const maxBytes = Number(process.env.MEDIA_MAX_BYTES || 10 * 1024 * 1024)
            const arrayBuffer = await mediaFile.arrayBuffer()
            if (arrayBuffer.byteLength > maxBytes) {
                return NextResponse.json({ error: `File too large. Max ${maxBytes} bytes` }, { status: 413 })
            }

            const id = randomUUID()
            const dir = getStorageDir()
            await ensureDir(dir)

            const safeName = (mediaFile.name || 'upload').replace(/[^a-zA-Z0-9_.-]/g, '_')
            const storedName = `${id}__${safeName}`
            const filePath = path.join(dir, storedName)

            await fs.writeFile(filePath, Buffer.from(arrayBuffer))

            const meta = {
                id,
                storedName,
                originalName: mediaFile.name || 'upload',
                mimeType: mediaFile.type || 'application/octet-stream',
                size: arrayBuffer.byteLength,
                createdAt: Date.now(),
            }
// store under public/media and return static URL
const reqUrl = new URL(request.url)
mediaUrl = `${reqUrl.origin}/media/${storedName}`
fileName = meta.originalName
mimeType = meta.mimeType
        }

        const hasMessage = typeof payloadMessage === 'string' && payloadMessage.trim().length > 0
        const hasMedia = typeof mediaUrl === 'string' && mediaUrl.trim().length > 0
        if (!hasMessage && !hasMedia) {
            return NextResponse.json({ error: 'Message or media is required' }, { status: 400 })
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
        await svc.queueSendMessage(to, payloadMessage, mediaUrl, hasMedia ? { mediaType: mapMessageTypeToMedia(messageType), fileName, mimeType } : undefined)

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
