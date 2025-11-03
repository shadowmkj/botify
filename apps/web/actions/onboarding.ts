"use server";

import { prisma } from "@repo/db";
import { z } from "zod";

const promoteSchema = z.object({
  email: z.string().email(),
});

export async function promoteFirstUser(input: z.infer<typeof promoteSchema>) {
  const { email } = promoteSchema.parse(input);

  const total = await prisma.user.count();
  if (total !== 1) {
    throw new Error("Onboarding is not available or already completed");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });
  if (!user) throw new Error("User not found after sign up");
  if (user.role === "admin") return { ok: true };

  await prisma.user.update({
    where: { id: user.id },
    data: { role: "admin" },
  });

  return { ok: true };
}
