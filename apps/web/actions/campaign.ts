'use server'

import { auth } from "@/lib/auth"
import { QUEUE_NAME } from "@/lib/constants/global"
import { prisma } from "@repo/db"
import { redis } from "@repo/redis"
import { WhatsappJob } from "@repo/types"
import { Queue } from "bullmq"
import { headers } from "next/headers"
import z from "zod"
import { revalidatePath } from "next/cache"
import { createCampaignSchema } from "@/app/(admin)/campaigns/new/campaignSchema"

export const createCampaign = async (values: z.infer<typeof createCampaignSchema>) => {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  const data = await prisma.campaign.create({
    data: {
      name: values.name,
      senderNumber: values.sender,
      userId: session?.user?.id!,
      campaignType: "Text",
      message: values.message
    }
  })

  const group = await prisma.contactGroup.findFirst({
    where: {
      id: values.contactGroupId
    },
    include: {
      contacts: true
    }
  })

  await Promise.all(group?.contacts.map(async (contact) => {
    await prisma.blast.create({
      data: {
        type: "Campaign",
        messageType: "Text",
        campaignId: data.id,
        contactId: contact.id
      }
    })
  }) || [])

  const q = new Queue<WhatsappJob>(QUEUE_NAME, {
    connection: redis
  })
  await q.add("campaign", {
    type: "campaign",
    campaignId: data.id,
    sender: values.sender
  }, {
    removeOnComplete: true,
    attempts: 3,
    removeOnFail: true
  })
}

export const deleteCampaign = async (id: string) => {
  await prisma.campaign.delete({
    where: {
      id: id
    }
  })
  revalidatePath("/campaigns")
}

export const updateCampaign = async (id: string, values: z.infer<typeof createCampaignSchema>) => {
  await prisma.campaign.update({
    where: {
      id: id
    },
    data: {
      name: values.name,
      senderNumber: values.sender,
      message: values.message
    }
  })
  revalidatePath("/campaigns")
}
