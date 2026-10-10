
"use server"

import { auth } from "@/lib/auth";
import { prisma } from "@repo/db";
import { headers } from "next/headers";

export const addAutoreply = async ({ keyword, reply, deviceNumber }: { keyword: string, reply: string, deviceNumber: string }) => {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error("Not authenticated")
  }

  const device = await prisma.device.findFirst({
    where: {
      body: deviceNumber,
      userId: session.user.id
    }
  })
  if (!device) {
    throw new Error("Device not found")
  }

  return await prisma.autoreply.create({
    data: {
      keyword,
      reply,
      deviceId: device.id,
    },
  })
}

export const deleteAutoreply = async ({ id }: { id: string }) => {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error("Not authenticated")
  }

  const autoreply = await prisma.autoreply.findFirst({
    where: {
      id,
      device: {
        userId: session.user.id
      }
    }
  })
  if (!autoreply) {
    throw new Error("Autoreply not found")
  }

  return await prisma.autoreply.delete({
    where: {
      id: id,
    }
  })
}
