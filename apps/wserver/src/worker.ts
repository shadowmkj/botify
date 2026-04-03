import { Job, Queue, Worker, JobsOptions } from 'bullmq';
import { redisOptions } from '@repo/redis';
import { startWhatsAppSession } from './lib/whatsapp';
import { sleep } from './utils/common';
import { QUEUE_NAME } from './utils/constants';
import logger from './utils/logger';
import { prisma } from '@repo/db';
import { phoneNumberSchema, type WhatsappJob } from '@repo/types';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';
import { WASocket, generateWAMessageContent } from 'baileys';
const { sendButtons, sendInteractiveMessage } = require('baileys_helper');

dotenv.config();

const inferFromUrl = (
    url: string,
): {
    kind: 'image' | 'video' | 'document';
    mime?: string;
    name?: string;
} => {
    try {
        const u = new URL(url);
        const pathname = u.pathname.toLowerCase();
        const name = decodeURIComponent(pathname.split('/').pop() || 'file');
        const ext = name.split('.').pop();
        const map: Record<
            string,
            { kind: 'image' | 'video' | 'document'; mime: string }
        > = {
            jpg: { kind: 'image', mime: 'image/jpeg' },
            jpeg: { kind: 'image', mime: 'image/jpeg' },
            png: { kind: 'image', mime: 'image/png' },
            webp: { kind: 'image', mime: 'image/webp' },
            gif: { kind: 'image', mime: 'image/gif' },
            mp4: { kind: 'video', mime: 'video/mp4' },
            mov: { kind: 'video', mime: 'video/quicktime' },
            pdf: { kind: 'document', mime: 'application/pdf' },
            docx: {
                kind: 'document',
                mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            },
            doc: { kind: 'document', mime: 'application/msword' },
            xlsx: {
                kind: 'document',
                mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
            csv: { kind: 'document', mime: 'text/csv' },
        };
        if (ext && map[ext]) return { ...map[ext], name };
        return { kind: 'document', name };
    } catch {
        return { kind: 'document' };
    }
};

export const sessions: Map<string, WASocket> = new Map();
export const msgRetryCounterCache = new NodeCache();

const queue = new Queue<WhatsappJob>(QUEUE_NAME, {
    connection: redisOptions(),
});

new Worker<WhatsappJob>(
    QUEUE_NAME,
    async (job: Job<WhatsappJob>) => {
        logger.info(`Processing job: ${job.name} for session: ${job.data.sender}`);
        switch (job.data.type) {
            case 'connect-whatsapp': {
                await startWhatsAppSession(job.data.sender, true);
                break;
            }
            case 'send-button': {
                const {
                    sender,
                    receiver,
                    title,
                    text,
                    footer,
                    buttons,
                    media,
                    mediaType,
                    fileName,
                    mimeType,
                } = job.data;
                const { success, data: validatedSender } =
                    phoneNumberSchema.safeParse(sender);
                if (success === false) {
                    logger.error(`Invalid sender number: ${sender}`);
                    break;
                }
                const sock = sessions.get(validatedSender);
                if (sock) {
                    try {
                        console.log(
                            `Sending message to ${receiver} from session ${validatedSender}`,
                        );
                        console.log(JSON.stringify(buttons))
                        const result = await sock.onWhatsApp(receiver);
                        let mediaMsg: any = undefined;

                        if (media && !media.startsWith('data:')) {
                            const inferred = mediaType
                                ? {
                                    kind: mediaType as 'image' | 'video' | 'document',
                                    mime: mimeType,
                                    name: fileName,
                                }
                                : inferFromUrl(media);

                            const messageObject: any = {};
                            if (inferred.kind === 'image') {
                                messageObject.image = { url: media };
                            } else if (inferred.kind === 'video') {
                                messageObject.video = { url: media };
                            } else {
                                messageObject.document = { url: media };
                                if (inferred.mime) messageObject.mimetype = inferred.mime;
                                messageObject.fileName = fileName || inferred.name || `${Date.now()}`;
                            }

                            // Generate the media portion of the WAMessage using WhiskeySockets
                            mediaMsg = await generateWAMessageContent(messageObject, { upload: sock.waUploadToServer });
                        }

                        const content: any = {
                            interactiveMessage: {
                                body: { text },
                                footer: footer ? { text: footer } : undefined,
                                nativeFlowMessage: {
                                    buttons
                                }
                            }
                        };

                        if (title || mediaMsg) {
                            content.interactiveMessage.header = {
                                title: title || undefined,
                                hasMediaAttachment: !!mediaMsg,
                                ...(mediaMsg || {}) // Injects imageMessage, documentMessage, etc.
                            };
                        }

                        const resp = await sendInteractiveMessage(sock, result ? result[0].jid : '', {
                            interactiveMessage: content.interactiveMessage
                        });
                        logger.info(`Interactive message sent with resp: ${resp?.key?.id}`);
                    }
                    catch (error) {
                        console.log(error)
                    }
                }

                break;
            }
            case 'send-message': {
                const {
                    sender,
                    receiver,
                    message,
                    blastId,
                    noDelay = false,
                    media,
                    mediaType,
                    fileName,
                    mimeType,
                } = job.data;
                const { success, data: validatedSender } =
                    phoneNumberSchema.safeParse(sender);
                if (success === false) {
                    logger.error(`Invalid sender number: ${sender}`);
                    break;
                }
                const sock = sessions.get(validatedSender);
                if (sock) {
                    try {
                        console.log(
                            `Sending message to ${receiver} from session ${validatedSender}`,
                        );
                        if (!noDelay) {
                            const randomDelay = Math.floor(Math.random() * 1000) + 500; // Random delay between 500ms and 1500ms
                            await sleep(randomDelay);
                        }
                        const result = await sock.onWhatsApp(receiver);
                        let response;
                        if (media) {
                            const isDataUrl = media.startsWith('data:');
                            if (isDataUrl) {
                                const [meta, base64] = media.split(',');
                                const buffer = Buffer.from(base64, 'base64');
                                const type = meta.split('/')[0].split(':')[1];
                                const fileType = meta.split('/')[1].split(';')[0];

                                let messageObject: any = { caption: message };
                                if (type === 'image') {
                                    messageObject.image = buffer;
                                } else if (type === 'video') {
                                    messageObject.video = buffer;
                                } else {
                                    messageObject.document = buffer;
                                    messageObject.mimetype = meta.split(':')[1].split(';')[0];
                                    messageObject.fileName = `${Date.now()}.${fileType}`;
                                }
                                response = await sock.sendMessage(
                                    result ? result[0].jid : '',
                                    messageObject,
                                );
                            } else {
                                // Treat media as URL (preferred flow)
                                const inferred = mediaType
                                    ? {
                                        kind: mediaType as 'image' | 'video' | 'document',
                                        mime: mimeType,
                                        name: fileName,
                                    }
                                    : inferFromUrl(media);

                                let messageObject: any = { caption: message };
                                if (inferred.kind === 'image') {
                                    messageObject.image = { url: media };
                                } else if (inferred.kind === 'video') {
                                    messageObject.video = { url: media };
                                } else {
                                    messageObject.document = { url: media };
                                    if (inferred.mime) messageObject.mimetype = inferred.mime;
                                    messageObject.fileName =
                                        fileName || inferred.name || `${Date.now()}`;
                                }
                                response = await sock.sendMessage(
                                    result ? result[0].jid : '',
                                    messageObject,
                                );
                            }
                        } else {
                            response = await sock.sendMessage(result ? result[0].jid : '', {
                                text: message,
                            });
                        }

                        if (response) {
                            await prisma.device.update({
                                data: {
                                    messagesSent: {
                                        increment: 1,
                                    },
                                },
                                where: {
                                    body: validatedSender,
                                },
                            });
                            if (blastId) {
                                await prisma.blast.update({
                                    where: {
                                        id: blastId,
                                    },
                                    data: {
                                        status: 'Sent',
                                    },
                                });
                            }
                        }
                        console.log(sock, result, response);
                    } catch (error) {
                        console.error('Failed to send message:', error);
                        if (blastId) {
                            await prisma.blast.update({
                                where: {
                                    id: blastId,
                                },
                                data: {
                                    status: 'Failed',
                                },
                            });
                        }
                        throw error; // Fail the job so it can be retried
                    }
                } else {
                    //TODO:: Handle case where session is not found (Message not sent)
                    console.error(`Session ${sender} not found. Cannot send message.`);
                    throw new Error(
                        `Session ${sender} not found. Cannot send message.`,
                    );
                }
                break;
            }
            case 'logout': {
                const { sender } = job.data;
                const { success, data: validatedSender } =
                    phoneNumberSchema.safeParse(sender);
                if (success === false) {
                    logger.error(`Invalid sender number: ${sender}`);
                    break;
                }
                const sock = sessions.get(validatedSender);
                if (sock) {
                    await sock.logout();
                    sessions.delete(validatedSender)
                }
                break;
            }

            case 'campaign': {
                const { sender, campaignId } = job.data;
                const campaign = await prisma.campaign.findFirst({
                    where: {
                        id: campaignId,
                    },
                    include: {
                        blasts: {
                            include: {
                                contact: true,
                            },
                        },
                    },
                });
                if (!campaign) {
                    break;
                }
                await queue.addBulk(
                    campaign.blasts.map((blast) => ({
                        name: 'send-message',
                        data: {
                            type: 'send-message',
                            sender: sender,
                            receiver: blast.contact.phone,
                            blastId: blast.id,
                            message: campaign.message ?? '',
                            media: campaign.media ?? undefined,
                        },
                        opts: {
                            attempts: 3,
                            removeOnComplete: true,
                            removeOnFail: true,
                        },
                    })),
                );
            }
        }
    },
    {
        connection: redisOptions(),
        removeOnComplete: {
            age: 0,
        },
        removeOnFail: {
            age: 0,
        },
    },
);

async function initializeWorker() {
    logger.info('WhatsApp worker initialized');
    const numbers = await prisma.device.findMany();
    numbers.forEach((number) => {
        queue.add(
            'connect-whatsapp',
            { sender: number.body, type: 'connect-whatsapp' },
            {
                delay: 1000, // Delay to avoid overwhelming the WhatsApp API
                attempts: 1,
            } as JobsOptions,
        );
    });
}

if (process.env.NODE_ENV !== 'test') {
    initializeWorker();
}
