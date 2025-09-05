import { QUEUE_NAME } from "@/lib/constants/global";
import { redis } from "@repo/redis";
import { WhatsappJob } from "@repo/types";
import { Queue } from "bullmq";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const queue = new Queue<WhatsappJob>(QUEUE_NAME, {
    connection: redis
  })
  await queue.add('send-message', {
    sender: body.sender,
    receiver: body.number,
    message: body.text,
    type: 'send-message',
  })
  return NextResponse.json({
    status: true,
    body: body,
  })
}

export async function GET() {

}
