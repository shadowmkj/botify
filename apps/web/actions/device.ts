"use server"

import { auth } from "@/lib/auth";
import { sendErrorResponse, sendSuccessResponse } from "@/lib/network";
import { prisma } from "@repo/db";
import { DeviceCreateValues } from "@/types"
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Queue } from "bullmq";
import { WhatsappJob } from "@repo/types";
import { QUEUE_NAME } from "@/lib/constants/global";
import { redis } from "@repo/redis";

export const getDevices = async () => {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session?.user) {
        throw new Error("User not authenticated");
    }

    const devices = await prisma.device.findMany({
        where: {
            userId: session.user.id
        }
    })

    return devices;
}

export const getConnectedDevices = async () => {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session?.user) {
        throw new Error("User not authenticated");
    }

    const devices = await prisma.device.findMany({
        where: {
            userId: session.user.id,
            status: "Connected"
        }
    })

    return devices;
}

export const addDevice = async (data: DeviceCreateValues) => {
    const { number } = data;
    const session = await auth.api.getSession({
        headers: await headers()
    })
    try {
        const res = await prisma.device.create({
            data: {
                body: number,
                userId: session?.user.id!,
            }
        })
        if (res) {
            console.log(res)
            return sendSuccessResponse(res);
        } else {
            return sendErrorResponse({
                error: "Failed to add device"
            })
        }
    } catch (error) {
        if (error instanceof Error && error.message.includes("Unique constraint failed")) {
            return sendErrorResponse({
                error: "Device with this number already exists"
            })
        }
        return sendErrorResponse({
            error: error instanceof Error ? error.message : "An unexpected error occurred"
        })
    }
}

export const deleteDevice = async (id: string) => {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    const device = await prisma.device.findFirst({
        where: {
            userId: session?.user.id!,
            id: id
        }
    })
    if (!device) {
        return sendErrorResponse({
            message: "Device not found"
        })
    }

    const res = await prisma.device.delete({
        where: {
            id: device.id
        }
    })
    if (res) {
        revalidatePath("/(admin)/devices");
        return sendSuccessResponse(res);
    } else {
        return sendErrorResponse({
            message: "Failed to delete device"
        })
    }
}

export const logoutDevice = async (id: string) => {
    const device = await prisma.device.findFirst({
        where: {
            id: id
        }
    })
    const queue = new Queue<WhatsappJob>(QUEUE_NAME, {
        connection:
        {
            host: process.env.REDIS_HOST || "localhost",
            port: Number(process.env.REDIS_PORT) || 6379,
            maxRetriesPerRequest: null
        },

    })
    await queue.add("logout", { sender: device?.body!, type: "logout" })
    return true
}










