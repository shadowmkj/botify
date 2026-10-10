import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { MessageService } from "@/lib/messageService";
import { verifyHMAC } from "@/lib/common";

export const config = {
    api: {
        bodyParser: false,
    },
};

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
            Device: true,
            shopifyTemplate: true
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
        if (!isValid) {
            return NextResponse.json({ error: "Invalid HMAC signature" }, { status: 401 })
        }

        const svc = new MessageService(user.Device[0].body, user.id)
        let content = "Hi Thank you for Shopping with us! This is a test message"
        if (user.shopifyTemplate) {
            const { parseTemplate } = await import('@/lib/templateParser')
            content = parseTemplate(user.shopifyTemplate.content, body)
        }

        const DEFAULT_ORDER_PHONE = "+917902708908";
        const extractedPhone = body.shipping_address?.phone || body.customer?.phone || body.billing_address?.phone || body.phone;
        const targetPhone = extractedPhone ? String(extractedPhone).trim() : DEFAULT_ORDER_PHONE;
        const STATIC_LOGO_URL = user.staticLogoUrl || "https://www.linvecreations.com/cdn/shop/files/linve.png?v=1774507969&width=165";

        if (body.order_status_url) {
            await svc.queueButtonMessage(
                targetPhone,
                content,
                content,
                "Order Confirmation",
                "Keep tracking your order",
                [
                    {
                        name: "cta_url",
                        buttonParamsJson: JSON.stringify({
                            display_text: "View Order",
                            url: body.order_status_url
                        })
                    }
                ],
                STATIC_LOGO_URL,
                { mediaType: 'image' }
            );
        } else {
            await svc.queueSendMessage(targetPhone, content);
        }
        return NextResponse.json({ message: 'Message queued successfully' }, { status: 200 })

    } else {
        return NextResponse.json({ error: "Missing or invalid shopifyKey" }, { status: 400 })
    }
}

