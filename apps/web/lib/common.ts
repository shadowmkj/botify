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
    try {
        const generatedHash = crypto
            .createHmac("sha256", secret)
            .update(rawBody)
            .digest("base64");

        const generatedBuf = Buffer.from(generatedHash);
        const headerBuf = Buffer.from(hmacHeader);

        if (generatedBuf.length !== headerBuf.length) {
            return false;
        }

        return crypto.timingSafeEqual(
            generatedBuf,
            headerBuf
        );
    } catch {
        return false;
    }
}


export function capitalizeFirstLetter(val: string) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

