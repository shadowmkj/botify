import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const template = await prisma.messageTemplate.findFirst({
            where: {
                id,
                userId: session.user.id
            }
        });

        if (!template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        const body = await req.json();
        const { name, content, type } = body;

        const updatedTemplate = await prisma.messageTemplate.update({
            where: { id: template.id },
            data: {
                ...(name && { name }),
                ...(content && { content }),
                ...(type && { type }),
            }
        });

        return NextResponse.json(updatedTemplate, { status: 200 });
    } catch (error) {
        console.error("Failed to update template:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const template = await prisma.messageTemplate.findFirst({
            where: {
                id,
                userId: session.user.id
            }
        });

        if (!template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        await prisma.messageTemplate.delete({
            where: { id: template.id }
        });

        return NextResponse.json({ message: "Template deleted" }, { status: 200 });
    } catch (error) {
        console.error("Failed to delete template:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
