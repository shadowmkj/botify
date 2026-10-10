import type { IUpsert } from "./types/bailey";
import { Queue } from "bullmq";
import { redis } from "@repo/redis";
import { QUEUE_NAME } from "./utils/constants";
import { WhatsappJob } from "@repo/types";
import { prisma } from "@repo/db";

let whatsappQueue: Queue<WhatsappJob> | null = null;

export function getWhatsappQueue(): Queue<WhatsappJob> {
  if (!whatsappQueue) {
    whatsappQueue = new Queue<WhatsappJob>(QUEUE_NAME, {
      connection: redis,
    });
  }
  return whatsappQueue;
}

const initAutoreply = async (upsert: IUpsert, number: string) => {
  const autoreplies = (
    await prisma.device.findMany({
      where: { body: number },
      include: { autoreplies: true },
    })
  ).flatMap((device: any) => device.autoreplies);

  if (!autoreplies.length) return;

  for (const message of upsert.messages) {
    const jid = message.key.remoteJid;
    if (!jid || message.key.fromMe || jid.endsWith('@g.us') || jid.endsWith('@broadcast')) {
      continue;
    }

    const rawRecipient = jid.replace(/@s\.whatsapp\.net$/, '').replace(/@c\.us$/, '').split(':')[0];
    if (!rawRecipient) continue;

    const receiver = rawRecipient.startsWith('+') ? rawRecipient : `+${rawRecipient}`;
    const text = (
      message.message?.extendedTextMessage?.text ??
      message.message?.conversation
    )?.trim().toLowerCase();

    if (!text) continue;

    for (const autoreply of autoreplies) {
      if (text === autoreply.keyword.trim().toLowerCase()) {
        const queue = getWhatsappQueue();
        await queue.add("send-message", {
          type: "send-message",
          sender: number,
          receiver,
          message: autoreply.reply,
          noDelay: true,
        });
      }
    }
  }
};

export default initAutoreply;
