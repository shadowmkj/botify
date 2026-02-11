"use server"

import { MessageService } from "@/lib/messageService"
import { phoneNumberSchema } from "@/types"
import {  prisma } from "@repo/db"
import z from "zod"

const sendMessageZSchema = z.object({
  message: z.string().max(500).default(''),
  receiver: phoneNumberSchema,
  sender: phoneNumberSchema,
  media: z.string().optional(),
  mediaType: z.enum(['image', 'video', 'document']).optional(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
}).superRefine((data, ctx) => {
  const hasMessage = typeof data.message === 'string' && data.message.trim().length > 0;
  const hasMedia = typeof data.media === 'string' && data.media.trim().length > 0;
  if (!hasMessage && !hasMedia) {
    ctx.addIssue({ code: 'custom', message: 'Message or media is required' });
  }
})

interface Props {
  message: string
  receiver: string
  sender: string
  media?: string
  mediaType?: 'image' | 'video' | 'document' | 'text'
  fileName?: string
  mimeType?: string
}

export const sendMessage = async (data: Props) => {
  const validated = sendMessageZSchema.safeParse(data)
  if (validated.success === false) {
    throw new Error("Invalid data: " + JSON.stringify(validated.error))
  }
  try {
    const device = await prisma.device.findUnique({
      where: { body: validated.data.sender },
      select: { userId: true },
    })
    if (!device) throw new Error("Device not found")

    const svc = new MessageService(validated.data.sender, device.userId)
    await svc.queueSendMessage(
      validated.data.receiver,
      validated.data.message,
      validated.data.media,
      validated.data.media ? { mediaType: validated.data.mediaType, fileName: validated.data.fileName, mimeType: validated.data.mimeType } : undefined
    )
  } catch (error: any) {
    if (error?.code === "QUOTA_EXCEEDED") {
      throw new Error(
        "Your plan limit is reached. Upgrade your plan or wait for reset."
      )
    }
    throw new Error("Failed to send message: " + error)
  }
  return {
    status: true,
    message: "Message queued successfully",
  }
}
