import { auth } from "@/lib/auth";
import { prisma } from "@repo/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const shopifySchema = z.object({
  shopifyKey: z
    .string()
    .min(1, "Shopify API Key is required")
    .min(8, "API Key must be at least 8 characters"),
  shopifyDomain: z
    .string()
    .min(1, "Shopify Domain is required")
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/,
      "Domain must be in the format: yourstore.myshopify.com"
    ),
  shopifyTemplateId: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = shopifySchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstError =
        Object.values(fieldErrors).flat()[0] ?? "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { shopifyKey, shopifyDomain, shopifyTemplateId } = parsed.data;

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        shopifyKey,
        shopifyDomain,
        shopifyTemplateId: shopifyTemplateId || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    // Do NOT log the error payload — it may contain the API key
    console.error("[settings/shopify] Failed to update Shopify settings");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    return NextResponse.json({
      shopifyKey: user?.shopifyKey ?? null,
      shopifyDomain: user?.shopifyDomain ?? null,
      shopifyTemplateId: user?.shopifyTemplateId ?? null,
      updatedAt: user?.updatedAt ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
