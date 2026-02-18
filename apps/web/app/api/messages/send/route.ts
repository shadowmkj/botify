/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { NextResponse } from 'next/server'
import { prisma } from '@repo/db'
import { MessageService } from '@/lib/messageService'
import { verifyApiAccess } from '@/lib/api-auth'
import { PERMISSIONS_MESSAGES_SEND, PERMISSIONS_MESSAGES_SEND_MEDIA } from '@/lib/constants/auth'
import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import parsePhoneNumberFromString from 'libphonenumber-js'

export const runtime = 'nodejs'

interface MediaData {
    mediaUrl: string
    fileName: string
    mimeType: string
}

function getStorageDir() {
    const raw = process.env.MEDIA_STORAGE_DIR
    if (raw && path.isAbsolute(raw)) return raw
    if (raw) return path.resolve(process.cwd(), raw)
    // default to Next public directory so files are served statically
    return path.join(process.cwd(), 'public', 'media')
}

const isMultipart = (req: Request) => {
    const contentType = req.headers.get('content-type');
    return contentType && contentType.includes('multipart/form-data');
}

async function ensureDir(dir: string) {
    await fs.mkdir(dir, { recursive: true })
}


const saveMedia = async (mediaFile: File | string | null, baseUrl: string) => {
    if (!mediaFile) {
        throw new Error('Media file is required for media messages')
    }
    if (typeof mediaFile === 'string') {
        return {
            mediaUrl: mediaFile,
            fileName: path.basename(mediaFile),
            mimeType: 'application/octet-stream'
        } as MediaData
    }

    const maxBytes = Number(process.env.MEDIA_MAX_BYTES || 10 * 1024 * 1024)
    const arrayBuffer = await mediaFile.arrayBuffer()
    if (arrayBuffer.byteLength > maxBytes) {
        throw new Error(`Media file exceeds maximum size of ${maxBytes} bytes`)
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
    const mediaUrl = `${baseUrl}/media/${storedName}`
    const fileName = meta.originalName
    const mimeType = meta.mimeType
    return { mediaUrl, fileName, mimeType } as MediaData
}

export async function POST(request: Request) {
    try {
        let from: string | null = null
        let to: string
        let messageType: 'image' | 'video' | 'document' | 'text'
        let content: string
        let mediaFile: File | string | null = null
        let mediaUrl: string = ""
        if (isMultipart(request)) {
            const formData = await request.formData()
            from = formData.get('from') as string | null
            to = formData.get('to') as string
            from = parsePhoneNumberFromString(from?.toString()!, "IN")?.number!
            to = parsePhoneNumberFromString(to?.toString()!, "IN")?.number!
            messageType = formData.get('messageType')?.toString() as 'image' | 'video' | 'document' | 'text'
            content = formData.get('content') as string
            mediaFile = formData.get('media') as File | null | string
        } else {
            const body = await request.json()
            from = body.from
            to = body.to
            from = parsePhoneNumberFromString(from!, "IN")?.number!
            to = parsePhoneNumberFromString(to!, "IN")?.number!
            messageType = body.messageType
            content = body.content || ''
            mediaUrl = body.media
        }

        console.log(from, to, mediaFile, mediaUrl);
        if (!to || !messageType || !from) {
            return NextResponse.json({ error: 'Missing required fields: to, messageType, sender' }, { status: 400 })
        }

        // Verify API key based on message type permissions
        const isMedia = messageType === 'image' || messageType === 'video' || messageType === 'document'
        const api = await verifyApiAccess(request, isMedia ? PERMISSIONS_MESSAGES_SEND_MEDIA : PERMISSIONS_MESSAGES_SEND)
        let mediaData: MediaData | null;

        //TODO: Validate here
        if (isMedia) {
            try {
                mediaData = await saveMedia(mediaUrl.length > 0 ? mediaUrl : mediaFile, process.env.NEXT_PUBLIC_APP_URL!)
                const device = await prisma.device.findUnique({ where: { body: from }, select: { userId: true } })

                if (!device) {
                    return NextResponse.json({ error: 'Device not found' }, { status: 404 })
                }

                // Enforce ownership: API key user must own the device
                if (device.userId !== api.userId) {
                    return NextResponse.json({ error: 'API key not authorized for this device' }, { status: 403 })
                }

                const svc = new MessageService(from, device.userId)
                await svc.queueSendMessage(to, content, mediaData?.mediaUrl, mediaData?.mediaUrl ? { mediaType: messageType, fileName: mediaData?.fileName, mimeType: mediaData?.mimeType } : undefined)

                return NextResponse.json({ message: 'Message queued successfully' }, { status: 200 })
            } catch (e) {
                console.error('Error processing media file:', e)
                return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed to process media file' }, { status: 400 })
            }
        }


        const device = await prisma.device.findUnique({ where: { body: from }, select: { userId: true } })

        if (!device) {
            return NextResponse.json({ error: 'Device not found' }, { status: 404 })
        }

        // Enforce ownership: API key user must own the device
        if (device.userId !== api.userId) {
            return NextResponse.json({ error: 'API key not authorized for this device' }, { status: 403 })
        }
        const svc = new MessageService(from, device.userId)
        await svc.queueSendMessage(to, content)
        return NextResponse.json({ message: 'Message queued successfully' }, { status: 200 })
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    } catch (error: any) {
        if (error instanceof Response) {
            return error
        }
        if (error?.code === 'QUOTA_EXCEEDED') {
            return NextResponse.json({ error: 'Your plan limit is reached. Upgrade your plan or wait for reset.' }, { status: 429 })
        }
        console.log(error)
        return NextResponse.json({ error: 'Failed to send message', message: error }, { status: 500 })
    }
}
