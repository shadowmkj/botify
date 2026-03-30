import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@repo/db";
import { ShopifySettingsClient } from "./client";

export default async function ShopifySettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      shopifyKey: true,
      shopifyDomain: true,
      shopifyTemplateId: true,
      updatedAt: true,
    },
  });

  const templates = await prisma.messageTemplate.findMany({
    where: { 
      userId: session.user.id,
      type: "shopify"
    },
    select: {
      id: true,
      name: true,
    }
  });

  return (
    <ShopifySettingsClient
      shopifyKey={user?.shopifyKey ?? null}
      shopifyDomain={user?.shopifyDomain ?? null}
      updatedAt={user?.updatedAt ?? null}
      shopifyTemplateId={user?.shopifyTemplateId ?? null}
      templates={templates}
    />
  );
}
