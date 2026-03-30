import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { shopifyTemplateId } = body;

        // Verify the template belongs to the user or is null to unset it
        if (shopifyTemplateId) {
            const template = await prisma.messageTemplate.findFirst({
                where: {
                    id: shopifyTemplateId,
                    userId: session.user.id
                }
            });

            if (!template) {
                return NextResponse.json({ error: "Template not found" }, { status: 404 });
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { shopifyTemplateId }
        });

        return NextResponse.json({ 
            message: "Shopify template updated successfully",
            shopifyTemplateId: updatedUser.shopifyTemplateId 
        }, { status: 200 });
        
    } catch (error) {
        console.error("Failed to update Shopify template:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
