import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const testSchema = z.object({
  shopifyKey: z.string().min(1),
  shopifyDomain: z
    .string()
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/),
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
    const parsed = testSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid credentials provided" },
        { status: 400 }
      );
    }

    const { shopifyKey, shopifyDomain } = parsed.data;

    // Test the Shopify connection by calling the shop endpoint
    const shopUrl = `https://${shopifyDomain}/admin/api/2024-01/shop.json`;
    const response = await fetch(shopUrl, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": shopifyKey,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401 || response.status === 403) {
      return NextResponse.json(
        { error: "Invalid API key. Please check your Shopify credentials." },
        { status: 400 }
      );
    }

    if (response.status === 404) {
      return NextResponse.json(
        { error: "Store not found. Please check your Shopify domain." },
        { status: 400 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: "Could not connect to Shopify. Please try again later." },
        { status: 400 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      shop: data.shop?.name ?? shopifyDomain,
    });
  } catch {
    // Do NOT log error — may contain sensitive API key data
    console.error("[settings/shopify/test] Connection test request failed");
    return NextResponse.json(
      { error: "Failed to reach Shopify. Check your domain and network." },
      { status: 500 }
    );
  }
}
