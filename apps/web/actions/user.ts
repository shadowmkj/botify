"use server"

import { prisma } from "@repo/db"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const updateLogoSchema = z.object({
  staticLogoUrl: z.string().url().or(z.literal("")).nullable().optional(),
})

export async function updateUserLogo(input: z.infer<typeof updateLogoSchema>) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("Not authenticated")

  const { staticLogoUrl } = updateLogoSchema.parse(input)

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      staticLogoUrl: staticLogoUrl || null,
    },
  })

  revalidatePath("/dashboard")
  return { ok: true }
}
