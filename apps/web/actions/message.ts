"use server"

import { MessageService } from "@/lib/messageService"
import { phoneNumberSchema } from "@/types"
import { prisma } from "@repo/db"
import z from "zod"

const sendMessageZSchema = z.object({
  message: z.string().min(1, "Message is required"),
  receiver: phoneNumberSchema,
  sender: phoneNumberSchema,
  media: z.string().optional(),
})

interface Props {
  message: string
  receiver: string
  sender: string
  media?: string
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
      validated.data.media
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
