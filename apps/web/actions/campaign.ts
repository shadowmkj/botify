'use server'

import { auth } from "@/lib/auth"
import { prisma, MessageType } from "@repo/db"
import { headers } from "next/headers"
import z from "zod"
import { revalidatePath } from "next/cache"
import { createCampaignSchema } from "@/app/(admin)/campaigns/new/campaignSchema"
import { MessageService } from "@/lib/messageService"

export const createCampaign = async (values: z.infer<typeof createCampaignSchema>) => {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  // Determine campaign type
  let campaignType: MessageType = MessageType.Text;

  if (values.isButtonCampaign) {
    campaignType = MessageType.Button;
  } else if (values.media) {
    const media = values.media;
    if (media.startsWith('data:')) {
      const type = media.split("/")[0].split(":")[1];
      if (type === "image") campaignType = MessageType.Image;
      else if (type === "video") campaignType = MessageType.Video;
      else campaignType = MessageType.Document;
    } else {
      try {
        const u = new URL(media);
        const pathname = u.pathname.toLowerCase();
        const name = decodeURIComponent(pathname.split('/').pop() || 'file');
        const ext = name.split('.').pop();
        const imageExts = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
        const videoExts = new Set(['mp4', 'mov', 'webm']);
        if (ext && imageExts.has(ext)) campaignType = MessageType.Image;
        else if (ext && videoExts.has(ext)) campaignType = MessageType.Video;
        else campaignType = MessageType.Document;
      } catch {
        campaignType = MessageType.Document;
      }
    }
  }

  // Parse button payload if provided
  let buttonPayload: object | undefined = undefined;
  if (values.isButtonCampaign && values.buttonPayloadJson) {
    try {
      buttonPayload = JSON.parse(values.buttonPayloadJson);
    } catch {
      throw new Error("Invalid button payload JSON.");
    }
  }

  const data = await prisma.campaign.create({
    data: {
      name: values.name,
      senderNumber: values.sender,
      userId: session?.user?.id!,
      campaignType: campaignType,
      message: values.isButtonCampaign ? null : (values.message || null),
      media: values.media || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      buttonPayload: buttonPayload as any ?? undefined,
    }
  })

  const group = await prisma.contactGroup.findFirst({
    where: { id: values.contactGroupId },
    include: { contacts: true }
  })

  // Create blast records — Button campaigns use MessageType.Button
  await Promise.all(group?.contacts.map(async (contact) => {
    await prisma.blast.create({
      data: {
        type: "Campaign",
        messageType: campaignType,
        campaignId: data.id,
        contactId: contact.id
      }
    })
  }) || [])

  try {
    const svc = new MessageService(values.sender, session?.user?.id!)
    if (values.isButtonCampaign && values.buttonPayloadJson) {
      await svc.queueButtonCampaign(data.id, values.buttonPayloadJson)
    } else {
      await svc.queueCampaign(data.id)
    }
  } catch (error: any) {
    if (error?.code === "QUOTA_EXCEEDED") {
      throw new Error("Your plan limit is reached. Upgrade your plan or wait for reset.")
    }
    throw error
  }
}

export const deleteCampaign = async (id: string) => {
  await prisma.campaign.delete({
    where: { id }
  })
  revalidatePath("/campaigns")
}

export const updateCampaign = async (id: string, values: z.infer<typeof createCampaignSchema>) => {
  await prisma.campaign.update({
    where: { id },
    data: {
      name: values.name,
      senderNumber: values.sender,
      message: values.message
    }
  })
  revalidatePath("/campaigns")
}
