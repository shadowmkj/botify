"use server"

import { auth } from "@/lib/auth";
import { prisma } from "@repo/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export const addContact = async ({ name, phone, groupId }: { name: string, phone: string, groupId: string }) => {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error("Not authenticated")
  }

  const group = await prisma.contactGroup.findFirst({
    where: { id: groupId, userId: session.user.id }
  })
  if (!group) {
    throw new Error("Contact group not found")
  }

  return await prisma.contact.create({
    data: {
      name,
      phone,
      userId: session.user.id,
      contactGroupId: groupId
    },
  })
}

export const deleteContact = async ({ id }: { id: string }) => {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error("Not authenticated")
  }

  const contact = await prisma.contact.findFirst({
    where: { id, userId: session.user.id }
  })
  if (!contact) {
    throw new Error("Contact not found")
  }

  return await prisma.contact.delete({
    where: { id }
  })
}

export const addContactGroup = async ({ name }: { name: string }) => {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error("Not authenticated")
  }

  return await prisma.contactGroup.create({
    data: {
      name,
      userId: session.user.id,
    },
  })
}

export const deleteContactGroup = async ({ id }: { id: string }) => {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user?.id) {
    throw new Error("Not authenticated")
  }

  const group = await prisma.contactGroup.findFirst({
    where: { id, userId: session.user.id }
  })
  if (!group) {
    throw new Error("Contact group not found")
  }

  return await prisma.contactGroup.delete({
    where: { id }
  })
}
