import { prisma } from "@repo/db"
import { Queue } from "bullmq"
import { QUEUE_NAME } from "@/lib/constants/global"
import type { NativeButton, WhatsappJob } from "@repo/types"

export class MessageService {
    sender: string
    userId: string
    private queue: Queue<WhatsappJob>

    constructor(sender: string, userId: string) {
        this.sender = sender
        this.userId = userId
        this.queue = new Queue<WhatsappJob>(QUEUE_NAME, {
            connection: {
                host: process.env.REDIS_HOST || "localhost",
                port: Number(process.env.REDIS_PORT) || 6379,
                maxRetriesPerRequest: null
            },
        })
    }

    async getUserWithPlan() {
        return prisma.user.findUnique({
            where: { id: this.userId },
            include: { plan: true },
        })
    }

    async getMessagesSent() {
        const devices = await prisma.device.findMany({
            where: { userId: this.userId },
            select: { messagesSent: true },
        })
        return devices.map(d => d.messagesSent).reduce((a, b) => a + b, 0)
    }

    async getRemainingMessages() {
        const user = await this.getUserWithPlan()
        const limit = user?.plan?.messageLimit ?? null
        if (limit === null) return Number.POSITIVE_INFINITY
        const sent = await this.getMessagesSent()
        return Math.max(0, limit - sent)
    }

    async assertCanQueue(requestedCount = 1) {
        const user = await this.getUserWithPlan()
        const limit = user?.plan?.messageLimit ?? null

        if (limit === null) {
            return { ok: true as const, left: Number.POSITIVE_INFINITY, limit: null as number | null }
        }

        const sent = await this.getMessagesSent()
        const left = Math.max(0, limit - sent)

        if (requestedCount > left) {
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            const error: any = new Error(`Not enough message quota. Left ${left}, requested ${requestedCount}`)
            error.code = "QUOTA_EXCEEDED"
            error.left = left
            error.limit = limit
            throw error
        }

        return { ok: true as const, left, limit }
    }

    async queueButtonMessage(
        receiver: string,
        message: string, text: string, title: string, footer: string,
        buttons: NativeButton[],
        media?: string,
        opts?: { mediaType?: 'image' | 'video' | 'text' | 'document'; fileName?: string; mimeType?: string }
    ) {
        return this.queue.add(
            "send-button",
            {
                type: "send-button",
                sender: this.sender,
                receiver,
                title,
                text,
                footer,
                buttons,
                media,
                mediaType: opts?.mediaType,
                fileName: opts?.fileName,
                mimeType: opts?.mimeType,
            },
            { attempts: 3, removeOnComplete: true, removeOnFail: true }
        )

    }

    async queueSendMessage(
        receiver: string,
        message: string,
        media?: string,
        opts?: { mediaType?: 'image' | 'video' | 'text' | 'document'; fileName?: string; mimeType?: string }
    ) {
        await this.assertCanQueue(1)
        return this.queue.add(
            "send-message",
            {
                type: "send-message",
                sender: this.sender,
                receiver,
                message,
                media,
                mediaType: opts?.mediaType?.toLowerCase() as "image" | "video" | "document" | undefined,
                fileName: opts?.fileName,
                mimeType: opts?.mimeType,
            },
            { attempts: 3, removeOnComplete: true, removeOnFail: true }
        )
    }

    async queueBulkSendMessages(items: Array<{ receiver: string; message: string; media?: string; mediaType?: 'image' | 'video' | 'document'; fileName?: string; mimeType?: string }>) {
        await this.assertCanQueue(items.length)
        return this.queue.addBulk(
            items.map(it => ({
                name: "send-message",
                data: {
                    type: "send-message",
                    sender: this.sender,
                    receiver: it.receiver,
                    message: it.message,
                    media: it.media,
                    mediaType: it.mediaType,
                    fileName: it.fileName,
                    mimeType: it.mimeType,
                } as WhatsappJob,
                opts: { attempts: 3, removeOnComplete: true, removeOnFail: true },
            }))
        )
    }

    async queueCampaign(campaignId: string) {
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            include: { blasts: true },
        })

        const toSend = campaign?.blasts.length ?? 0
        if (toSend <= 0) return null

        await this.assertCanQueue(toSend)

        return this.queue.add(
            "campaign",
            {
                type: "campaign",
                sender: this.sender,
                campaignId,
            },
            { attempts: 3, removeOnComplete: true, removeOnFail: true }
        )
    }

    /**
     * Fan out individual send-button jobs for a button campaign (Option A).
     * Looks up the campaign's contacts via blast records, builds Baileys buttons
     * from the stored buttonPayloadJson, and adds one job per contact.
     */
    async queueButtonCampaign(campaignId: string, buttonPayloadJson: string) {
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            include: {
                blasts: {
                    include: { contact: true }
                }
            }
        })

        if (!campaign || campaign.blasts.length === 0) return null

        // Lazily import to keep the server-side util out of the client bundle
        const { buildButtonMessageArgs } = await import("@/lib/buildButtonPayload")

        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        let parsed: any
        try {
            parsed = JSON.parse(buttonPayloadJson)
        } catch {
            throw new Error("Invalid buttonPayloadJson")
        }

        const { title, text, footer, buttons } = buildButtonMessageArgs(parsed)

        return this.queue.addBulk(
            campaign.blasts.map((blast) => ({
                name: "send-button",
                data: {
                    type: "send-button" as const,
                    sender: this.sender,
                    receiver: blast.contact.phone,
                    title,
                    text,
                    footer: footer ?? "",
                    buttons,
                    media: campaign.media ?? undefined,
                },
                opts: { attempts: 3, removeOnComplete: true, removeOnFail: true },
            }))
        )
    }
}
