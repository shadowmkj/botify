import { verifyHMAC } from "@/lib/common";
import { MessageService } from "@/lib/messageService";
import { prisma } from "@repo/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const rawBody = Buffer.from(await request.arrayBuffer());
    const body = JSON.parse(rawBody.toString());
    console.log(request.headers)
    console.log(body)
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

    if (shopifyKey && user.shopifyKey) {
        const isValid = verifyHMAC(rawBody, shopifyKey, user.shopifyKey)
        console.log("VALIDITY: ", isValid, shopifyDomain)
        if (isValid) {
            const svc = new MessageService(user.Device[0].body, user.id)
            const content = `${body.title} has been updated`
            await svc.queueSendMessage("+917012749946", content)
            return NextResponse.json({ message: 'Message queued successfully' }, { status: 200 })
        } else {
            return NextResponse.json({ error: "Invalid shopifyKey" }, { status: 404 })
        }

    } else {
        console.log("VALIDITY: ", false, shopifyDomain)
    }

    return NextResponse.json({ error: "Invalid shopifyKey" }, { status: 404 })
}

