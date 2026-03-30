import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import TemplateClient from "./client";
import { prisma } from "@repo/db";

export default async function TemplatesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const templates = await prisma.messageTemplate.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Message Templates</h1>
        <p className="text-muted-foreground">
          Create and manage custom templates for your notification events.
        </p>
      </div>

      <TemplateClient initialTemplates={templates} />
    </div>
  );
}
