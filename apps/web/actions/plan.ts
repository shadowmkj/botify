'use server'

import { prisma } from "@repo/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import z from "zod";
import { auth } from "@/lib/auth";
import { planSchema } from "@/app/(admin)/plans/new/planSchema";
import { randomUUID } from "crypto";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");
  const role = (session.user as unknown as { role?: string })?.role;
  if (role !== "admin") throw new Error("Not authorized");
  return session;
}

export const createPlan = async (values: z.infer<typeof planSchema>) => {
  await requireAdmin();

  await prisma.plan.create({
    data: {
      id: randomUUID(),
      name: values.name,
      description: values.description || null,
      price: values.price,
      messageLimit: values.messageLimit ?? null,
      devicesLimit: values.devicesLimit,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  revalidatePath("/plans");
};

export const updatePlan = async (id: string, values: z.infer<typeof planSchema>) => {
  await requireAdmin();

  await prisma.plan.update({
    where: { id },
    data: {
      name: values.name,
      description: values.description || null,
      price: values.price,
      messageLimit: values.messageLimit ?? null,
      devicesLimit: values.devicesLimit,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/plans");
};

export const deletePlan = async (id: string) => {
  await requireAdmin();

  await prisma.plan.delete({ where: { id } });
  revalidatePath("/plans");
};

export const getPlans = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return prisma.plan.findMany({
    orderBy: { createdAt: "desc" },
  });
};
