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
    const rawBody = Buffer.from(await request.arrayBuffer());
    const body = JSON.parse(rawBody.toString());
    console.log(request.headers)
    console.log(body)
    const shopifyDomain = request.headers.get('x-shopify-shop-domain')
    const shopifyKey = request.headers.get('x-shopify-hmac-sha256')
    const phone: string | null = body.customer.phone

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

    if (shopifyKey && user.shopifyKey) {
        const isValid = verifyHMAC(rawBody, shopifyKey, user.shopifyKey)
        console.log("VALIDITY: ", isValid, shopifyDomain)
        const svc = new MessageService(user.Device[0].body, user.id)
        let content = "Hi Thank you for Shopping with us! This is a test message"
        if (user.shopifyTemplate) {
            const { parseTemplate } = await import('@/lib/templateParser')
            content = parseTemplate(user.shopifyTemplate.content, body)
        }

        console.log("Number: ", body.shipping_address?.phone || phone)
        // const targetPhone = body.shipping_address?.phone || phone || "+917902708908";
        const targetPhone = "+917902708908";
        // const STATIC_LOGO_URL = "https://www.linvecreations.com/cdn/shop/files/linve.png?v=1774507969&width=165"; // Replace with your actual logo URL
        const STATIC_LOGO_URL = "https://cdn.shopify.com/s/files/1/0721/5146/6041/files/linvered.png?v=1775490870"; // Replace with your actual logo URL

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
        console.log("VALIDITY: ", false, shopifyDomain)
    }

    return NextResponse.json(body)
}

