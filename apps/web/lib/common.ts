import { prisma } from "@repo/db";
export async function getMessagesSent(userId: string) {
    const devices = await prisma.device.findMany({
        where: { userId: userId },
    })
    const messagesSent = devices.map((device) => device.messagesSent).reduce((a, b) => a + b, 0)
    return messagesSent
}


export function capitalizeFirstLetter(val: string) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

