/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { NextResponse } from 'next/server'
import { prisma } from '@repo/db'
import { NativeButtonSchema } from '@repo/types'
import { MessageService } from '@/lib/messageService'
import { verifyApiAccess } from '@/lib/api-auth'
import { PERMISSIONS_MESSAGES_SEND, } from '@/lib/constants/auth'
import parsePhoneNumberFromString from 'libphonenumber-js'
import z from 'zod'

export const runtime = 'nodejs'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const buttons: string = body.buttons;
        let from: string | null = body.from
        let to: string = body.to
        from = parsePhoneNumberFromString(from!, "IN")?.number!
        to = parsePhoneNumberFromString(to!, "IN")?.number!
        const title = body.title || ''
        const text = body.text || ''
        const footer = body.footer || ''
        const parsedButtons = z.array(NativeButtonSchema).safeParse(buttons)
        if (!parsedButtons.success) {
            return NextResponse.json({ error: 'Invalid buttons object' }, { status: 400 })
        }
        if (!to || !from) {
            return NextResponse.json({ error: 'Missing required fields: to, messageType, sender' }, { status: 400 })
        }

        const api = await verifyApiAccess(request, PERMISSIONS_MESSAGES_SEND)

        const device = await prisma.device.findUnique({ where: { body: from }, select: { userId: true } })

        if (!device) {
            return NextResponse.json({ error: 'Device not found' }, { status: 404 })
        }

        // Enforce ownership: API key user must own the device
        if (device.userId !== api.userId) {
            return NextResponse.json({ error: 'API key not authorized for this device' }, { status: 403 })
        }
        const svc = new MessageService(from, device.userId)
        await svc.queueButtonMessage(to, text, text, title, footer, parsedButtons.data)
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
