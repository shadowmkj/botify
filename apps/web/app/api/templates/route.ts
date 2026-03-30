import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const templates = await prisma.messageTemplate.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json(templates);
    } catch (error) {
        console.error("Failed to fetch templates:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, content, type } = body;

        if (!name || !content || !type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newTemplate = await prisma.messageTemplate.create({
            data: {
                name,
                content,
                type,
                userId: session.user.id
            }
        });

        return NextResponse.json(newTemplate, { status: 201 });
    } catch (error) {
        console.error("Failed to create template:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
