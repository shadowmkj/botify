"use server"

import { MessageService } from "@/lib/messageService"
import { phoneNumberSchema } from "@/types"
import { prisma } from "@repo/db"
import z from "zod"
import { buildButtonMessageArgs } from "@/lib/buildButtonPayload"
import type { ButtonMessagePayload } from "@/components/message/ButtonMessageTypes"

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

// ─── Button Message ───────────────────────────────────────────────────────────

const sendButtonZSchema = z.object({
  receiver: phoneNumberSchema,
  sender: phoneNumberSchema,
  media: z.string().optional(),
  mediaType: z.enum(['image', 'video', 'document', 'text']).optional(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
})

interface SendButtonProps {
  receiver: string
  sender: string
  buttonPayload: ButtonMessagePayload
  media?: string
  mediaType?: 'image' | 'video' | 'document' | 'text'
  fileName?: string
  mimeType?: string
}

export const sendButtonMessage = async ({ receiver, sender, buttonPayload, media, mediaType, fileName, mimeType }: SendButtonProps) => {
  const validated = sendButtonZSchema.safeParse({ receiver, sender, media, mediaType, fileName, mimeType })
  if (!validated.success) {
    throw new Error("Invalid data: " + JSON.stringify(validated.error))
  }

  if (!buttonPayload.body.trim()) {
    throw new Error("Button message body is required.")
  }
  if (buttonPayload.buttons.length === 0) {
    throw new Error("At least one button is required.")
  }
  if (buttonPayload.buttons.length > 3) {
    throw new Error("Maximum 3 buttons allowed.")
  }

  try {
    const device = await prisma.device.findUnique({
      where: { body: validated.data.sender },
      select: { userId: true },
    })
    if (!device) throw new Error("Device not found")

    const { title, text, footer, buttons } = buildButtonMessageArgs(buttonPayload)
    const svc = new MessageService(validated.data.sender, device.userId)
    await svc.queueButtonMessage(
      validated.data.receiver,
      text,
      text,
      title,
      footer ?? "",
      buttons,
      media,
      media ? { mediaType, fileName, mimeType } : undefined
    )
  } catch (error: any) {
    if (error?.code === "QUOTA_EXCEEDED") {
      throw new Error("Your plan limit is reached. Upgrade your plan or wait for reset.")
    }
    throw new Error("Failed to queue button message: " + error)
  }

  return {
    status: true,
    message: "Button message queued successfully",
  }
}
