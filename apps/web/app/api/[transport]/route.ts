
import { MessageService } from "@/lib/messageService";
import { prisma } from "@repo/db";
import { createMcpHandler } from "mcp-handler";
import fs from "fs";
import { z } from "zod";

const handler = async (req: Request) => {
    // const session = await auth.api.getMcpSession({
    //     headers: req.headers
    // })
    // if(!session){
    //     return new Response(null, {
    //         status: 401
    //     })
    // }
    return createMcpHandler(
        (server) => {
            server.registerTool(
                "roll_dice",
                {
                    title: "Roll Dice",
                    description: "Rolls a dice with a specified number of sides and returns the result.",
                    inputSchema: {
                        sides: z.number().min(2).default(6),
                    }
                },
                async ({ sides }) => {
                    const result = Math.floor(Math.random() * sides) + 1;
                    return {
                        content: [{ type: "text", text: `You rolled a ${result} on a ${sides}-sided dice.` }],
                    };
                }
            );
            server.registerTool(
                "send_message",
                {
                    title: "Send Message",
                    description: "Sends a message from a specified sender device to a recipient.",
                    inputSchema: {
                        to: z.string().min(1),
                        sender: z.string().min(1),
                        message: z.string().min(1).optional(),
                    }
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
            );
            server.registerTool(
                "get_number",
                {
                    title: "Get Contact Number",
                    description: "Retrieves the phone number of a contact by name.",
                    inputSchema: {
                        name: z.string().min(1),
                    }
                },
                async ({ name }) => {
                    //TODO: This is a temporary solution. We should use a proper contact book.
                    const data = JSON.parse(fs.readFileSync('my-contacts.json', 'utf-8'));
                    const contacts = data.find((c: { name: string }) => c.name.toLowerCase().includes(name.toLowerCase()));
                    if (!contacts) {
                        return {
                            content: [{ type: "text", text: `No contact found with the name ${name}` }],
                        };
                    }
                    if (contacts.length > 1) {
                        const names = contacts.map((c: { name: string }) => c.name).join(", ");
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
        },
        {

        },
        {
            basePath: "/api",
            verboseLogs: true,
        }
    )(req);
}

export { handler as GET, handler as POST, handler as DELETE };
