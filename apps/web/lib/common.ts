import { prisma } from "@repo/db";
export async function getMessagesSent(userId: string) {
    const devices = await prisma.device.findMany({
        where: { userId: userId },
    })
    const messagesSent = devices.map((device) => device.messagesSent).reduce((a, b) => a + b, 0)
    return messagesSent
}
