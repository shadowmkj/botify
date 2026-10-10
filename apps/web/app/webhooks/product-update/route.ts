import { verifyHMAC } from "@/lib/common";
import { MessageService } from "@/lib/messageService";
import { prisma } from "@repo/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    let text = "";
    try {
        text = await request.text();
    } catch {
        return NextResponse.json({ error: "Failed to read request body" }, { status: 400 });
    }

    const rawBody = Buffer.from(text);
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    let body: any;
    try {
        body = JSON.parse(text);
    } catch {
        return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const shopifyDomain = request.headers.get('x-shopify-shop-domain')
    const shopifyKey = request.headers.get('x-shopify-hmac-sha256')

    const user = await prisma.user.findFirst({
        where: {
            shopifyDomain: shopifyDomain
        },
        include: {
            Device: true
        }
    })

    if (!user) {
        return NextResponse.json({
            error: "Invalid shopify domain (user not found)"
        }, {
            status: 404
        })
    }

    if (!user.Device || user.Device.length === 0) {
        return NextResponse.json({
            error: "No connected device found for user"
        }, {
            status: 400
        })
    }

    if (shopifyKey && user.shopifyKey) {
        const isValid = verifyHMAC(rawBody, shopifyKey, user.shopifyKey)
        if (isValid) {
            const svc = new MessageService(user.Device[0].body, user.id)
            const content = `${body.title || "Product"} has been updated`
            // Fallback default notification phone number (Note: dynamic notification destination configuration is pending completion)
            const DEFAULT_NOTIFICATION_PHONE = "+917012749946";
            const targetPhone = DEFAULT_NOTIFICATION_PHONE;
            await svc.queueSendMessage(targetPhone, content)
            return NextResponse.json({ message: 'Message queued successfully' }, { status: 200 })
        } else {
            return NextResponse.json({ error: "Invalid shopifyKey" }, { status: 401 })
        }

    } else {
        return NextResponse.json({ error: "Missing shopifyKey" }, { status: 400 })
    }
}

