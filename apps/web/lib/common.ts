import { prisma } from "@repo/db";
import crypto from "crypto"

export async function getMessagesSent(userId: string) {
    const devices = await prisma.device.findMany({
        where: { userId: userId },
    })
    const messagesSent = devices.map((device) => device.messagesSent).reduce((a, b) => a + b, 0)
    return messagesSent
}

export const verifyHMAC = (rawBody: Buffer,
    hmacHeader: string,
    secret: string) => {
    const generatedHash = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("base64");

    return crypto.timingSafeEqual(
        Buffer.from(generatedHash),
        Buffer.from(hmacHeader)
    );
}


export function capitalizeFirstLetter(val: string) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

