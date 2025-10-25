import { prisma } from "@repo/db"
import { Queue } from "bullmq"
import { redis } from "@repo/redis"
import { QUEUE_NAME } from "@/lib/constants/global"
import type { WhatsappJob } from "@repo/types"

export class MessageService {
  sender: string
  userId: string
  private queue: Queue<WhatsappJob>

  constructor(sender: string, userId: string) {
    this.sender = sender
    this.userId = userId
    this.queue = new Queue<WhatsappJob>(QUEUE_NAME, { connection: redis })
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
      const error: any = new Error(`Not enough message quota. Left ${left}, requested ${requestedCount}`)
      error.code = "QUOTA_EXCEEDED"
      error.left = left
      error.limit = limit
      throw error
    }

    return { ok: true as const, left, limit }
  }

  async queueSendMessage(receiver: string, message: string, media?: string) {
    await this.assertCanQueue(1)
    return this.queue.add(
      "send-message",
      {
        type: "send-message",
        sender: this.sender,
        receiver,
        message,
        media,
      },
      { attempts: 3, removeOnComplete: true, removeOnFail: true }
    )
  }

  async queueBulkSendMessages(items: Array<{ receiver: string; message: string; media?: string }>) {
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
}
