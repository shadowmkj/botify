"use server"

import { prisma } from "@repo/db"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { z } from "zod"

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("Not authenticated")
  const role = (session.user as unknown as { role?: string })?.role
  if (role !== "admin") throw new Error("Not authorized")
  return session
}

const updateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120).optional().nullable(),
  role: z.enum(["user", "admin"]),
  banned: z.boolean().optional().nullable(),
  banReason: z.string().max(500).nullable().optional(),
})

export async function updateUser(input: z.infer<typeof updateUserSchema>) {
  await requireAdmin()
  const { id, name, role, banned, banReason } = updateUserSchema.parse(input)

  const safeBanReason = banned ? (banReason ?? null) : null

  await prisma.user.update({
    where: { id },
    data: {
      name: name ?? null,
      role,
      banned: !!banned,
      banReason: safeBanReason,
    },
  })

  revalidatePath("/manage-users")
  revalidatePath(`/manage-users/${id}`)
  return { ok: true }
}

const assignPlanSchema = z.object({
  userId: z.string().min(1),
  planId: z.string().min(1).nullable(),
})

export async function assignPlan(input: z.infer<typeof assignPlanSchema>) {
  await requireAdmin()
  const { userId, planId } = assignPlanSchema.parse(input)

  if (planId) {
    const exists = await prisma.plan.findUnique({ where: { id: planId }, select: { id: true } })
    if (!exists) throw new Error("Plan not found")
  }

  await prisma.user.update({
    where: { id: userId },
    data: { planId },
  })

  revalidatePath("/manage-users")
  revalidatePath(`/manage-users/${userId}`)
  return { ok: true }
}

const impersonateSchema = z.object({
  userId: z.string().min(1),
})

export async function impersonateUser(input: z.infer<typeof impersonateSchema>) {
  await requireAdmin()
  const { userId } = impersonateSchema.parse(input)

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, banned: true },
  })
  if (!target) throw new Error("User not found")
  if (target.role === "admin") throw new Error("Cannot impersonate another admin")
  if (target.banned) throw new Error("Cannot impersonate a banned user")

  // Use Better Auth admin API to set cookies for impersonation
  // Adjust method name if your version exposes a different function
  await (auth.api as any).adminImpersonateUser({
    body: { userId },
    headers: await headers(),
  })

  redirect("/dashboard")
}
