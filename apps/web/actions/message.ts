"use server"

import { QUEUE_NAME } from "@/lib/constants/global"
import { redis } from "@repo/redis"
import { phoneNumberSchema, sendMessageSchema } from "@/types";
import { WhatsappJob } from "@repo/types";
import { Queue } from "bullmq"
import { NextResponse } from "next/server";
import z from "zod";

const sendMessageZSchema = z.object({
  message: z.string().min(1, "Message is required"),
  receiver: phoneNumberSchema,
  sender: phoneNumberSchema,
  media: z.string().optional()
})


interface Props {
  message: string;
  receiver: string;
  sender: string;
  media?: string;
}
export const sendMessage = async (data: Props) => {
  const validated = sendMessageZSchema.safeParse(data)
  if (validated.success === false) {
    throw new Error("Invalid data: " + JSON.stringify(validated.error));
  }
  try {
    const queue = new Queue<WhatsappJob>(QUEUE_NAME, { connection: redis });
    await queue.add('send-message', {
      type: 'send-message',
      sender: validated.data.sender,
      receiver: validated.data.receiver,
      message: validated.data.message,
      media: validated.data.media
    })
  } catch (error) {
    throw new Error("Failed to send message: " + error);
  }
  return {
    status: true,
    message: "Message queued successfully"
  }
}
