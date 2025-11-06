import { auth } from "@/lib/auth";
import { MessageService } from "@/lib/messageService";
import { prisma } from "@repo/db";
import { createMcpHandler } from "mcp-handler";
import fs from "fs";
import { z } from "zod";

const handler = async (req: Request) => {
    const session = await auth.api.getMcpSession({
        headers: req.headers
    })
    // if(!session){
    //     return new Response(null, {
    //         status: 401
    //     })
    // }
    return createMcpHandler(
        (server) => {
            server.tool(
                "roll_dice",
                "Rolls an N-sided die",
                {
                    sides: z.number().int().min(2),
                },
                async ({ sides }) => {
                    const value = 1 + Math.floor(Math.random() * sides);
                    return {
                        content: [{ type: "text", text: `🎲 You rolled a ${value}!` }],
                    };
                }
            ),
                server.tool(
                    "send_message",
                    "Sends a whatsapp message using Botify",
                    {
                        to: z.string().min(1),
                        sender: z.string().min(1),
                        message: z.string().min(1).optional(),
                    },
                    async ({ to, sender, message }) => {
                        const user = await prisma.user.findFirst({
                            where: {
                                Device: { some: { body: sender } }
                            },
                        });
                        if (!user) {
                            return {
                                content: [{ type: "text", text: `Error: Sender device not found.` }],
                            };
                        }
                        const messageService = new MessageService(sender, user.id);
                        await messageService.queueSendMessage(to, message || "");
                        return {
                            content: [{ type: "text", text: `` }],
                        };
                    }
                ),
                server.tool(
                    "get_number",
                    "Get the number of a person from their name",
                    { name: z.string() },
                    async ({ name }) => {
                    const data = JSON.parse(fs.readFileSync('my-contacts.json', 'utf-8'));
                    const contacts = data.find((c: any) => c.name.toLowerCase().includes(name.toLowerCase()));
                    if (!contacts) {
                        return {
                            content: [{ type: "text", text: `No contact found with the name ${name}` }],
                        };
                    }
                    if (contacts.length > 1) {
                        const names = contacts.map((c: any) => c.name).join(", ");
                        return {
                            content: [{ type: "text", text: `Multiple contacts found with the name ${name}: ${names}` }],
                        };
                    }
                    const contact = contacts.number;
                    console.log("contact", contacts)
                        return {
                            content: [{ type: "text", text: `The number of ${name} is ${contact}` }],
                        };
                    },
                );
                server.tool(
                    "echo",
                    "Echo a message",
                    { message: z.string() },
                    async ({ message }) => {
                        return {
                            content: [{ type: "text", text: `Tool echo: ${message}` }],
                        };
                    },
                );
        },
        {
            capabilities: {
                tools: {
                    echo: {
                        description: "Echo a message",
                    },
                    roll_dice: {
                        description: "Roll a dice",
                    },
                },
            },
        },
        {
            redisUrl: process.env.REDIS_URL,
            basePath: "/api",
            verboseLogs: true,
            maxDuration: 60,
        },
    )(req);
}

export { handler as GET, handler as POST, handler as DELETE };
