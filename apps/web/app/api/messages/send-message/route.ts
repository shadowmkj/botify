import { NextResponse } from "next/server"
import { prisma } from "@repo/db"
import { MessageService } from "@/lib/messageService"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const sender: string | undefined = body?.sender
        const receiver: string | undefined = body?.number
        const message: string | undefined = body?.text
        const media: string | undefined = body?.media

        if (!sender || !receiver || !message) {
            return NextResponse.json({ error: "Missing sender, number, or text" }, { status: 400 })
        }

        const device = await prisma.device.findUnique({ where: { body: sender }, select: { userId: true } })
        if (!device) {
            return NextResponse.json({ error: "Device not found" }, { status: 404 })
        }

        const svc = new MessageService(sender, device.userId)
        await svc.queueSendMessage(receiver, message, media)

        return NextResponse.json({ status: true, message: "Message queued successfully" }, { status: 200 })
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    } catch (error: any) {
        console.log(error.code)
        if (error?.code === "QUOTA_EXCEEDED") {
            return NextResponse.json({ error: "Your plan limit is reached. Upgrade your plan or wait for reset." }, { status: 429 })
        }
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }
}

export async function GET() { }
