import { prisma } from '@repo/db';
import { phoneNumberSchema, type WhatsappJob } from "@repo/types";
import { Job, Queue, Worker } from 'bullmq';
import NodeCache from 'node-cache';
import { startWhatsAppSession } from './lib/whatsapp';
import { sleep } from './utils/common';
import { QUEUE_NAME } from './utils/constants';
import logger from './utils/logger';
import { redis } from './utils/redis';
export const sessions = new Map();
export const msgRetryCounterCache = new NodeCache();
const queue = new Queue<WhatsappJob>(QUEUE_NAME, {
  connection: redis,
});

new Worker<WhatsappJob>(QUEUE_NAME, async (job: Job<WhatsappJob>) => {
  logger.info(`Processing job: ${job.name} for session: ${job.data.sender}`);
  switch (job.data.type) {
    case 'connect-whatsapp': {
      await startWhatsAppSession(job.data.sender);
      break;
    }
    case 'send-message': {
      const { sender, receiver, message, blastId, noDelay = false } = job.data
      const { success, data: validatedSender } = phoneNumberSchema.safeParse(sender);
      if (success === false) {
        logger.error(`Invalid sender number: ${sender}`);
        break;
      }
      const sock = sessions.get(validatedSender);
      if (sock) {
        try {
          console.log(`Sending message to ${receiver} from session ${validatedSender}`);
          //TODO: Good place to add delay
          if (!noDelay) {
            const randomDelay = Math.floor(Math.random() * 1000) + 500; // Random delay between 500ms and 1500ms
            await sleep(randomDelay);
          }
          // await sock.sendMessage(`${to}@s.whatsapp.net`, { text });
          const result = await sock.onWhatsApp(receiver);
          const response = await sock.sendMessage(result ? result[0].jid : "", {
            text: message,
          });
          if (response) {
            await prisma.device.update({
              data: {
                messagesSent: {
                  increment: 1,
                }
              },
              where: {
                body: validatedSender
              }
            })
            if (blastId) {
              const blast = await prisma.blast.update({
                where: {
                  id: blastId
                },
                data: {
                  status: 'Sent',
                }
              })
            }
          }
          console.log(sock, result, response);
        } catch (error) {
          console.error('Failed to send message:', error);
          if (blastId) {
            const blast = await prisma.blast.update({
              where: {
                id: blastId
              },
              data: {
                status: 'Failed',
              }
            })
          }
          throw error; // Fail the job so it can be retried
        }
      } else {
        //TODO:: Handle case where session is not found (Message not sent)
        console.error(`Session ${sender} not found. Cannot send message.`);
        throw new Error(`Session ${sender} not found. Cannot send message.`);
      }
      break;
    }
    case 'logout': {
      const { sender } = job.data
      const { success, data: validatedSender } = phoneNumberSchema.safeParse(sender);
      if (success === false) {
        logger.error(`Invalid sender number: ${sender}`);
        break;
      }
      const sock = sessions.get(validatedSender);
      if (sock) {
        await sock.logout()
      }
      break;
    }

    case 'campaign': {
      const { sender, campaignId } = job.data
      const campaign = await prisma.campaign.findFirst({
        where: {
          id: campaignId
        },
        include: {
          blasts: {
            include: {
              contact: true
            }
          }
        }
      })
      if (!campaign) {
        break;
      }
      await queue.addBulk(
        campaign.blasts.map((blast) => {
          return {
            name: "send-message",
            data: {
              type: 'send-message',
              sender: sender,
              receiver: blast.contact.phone,
              blastId: blast.id,
              message: campaign.message ?? "Default"
            },
            opts: {
              attempts: 3,
              removeOnComplete: true,
              removeOnFail: true,
            }
          }
        })
      )
    }
  }
}, {
  connection: redis, removeOnComplete: {
    age: 0
  }, removeOnFail: {
    age: 0
  }
});

async function initializeWorker() {
  logger.info('WhatsApp worker initialized');
  const numbers = await prisma.device.findMany();
  numbers.forEach(number => {
    queue.add('connect-whatsapp', { sender: number.body, type: 'connect-whatsapp' }, {
      delay: 1000, // Delay to avoid overwhelming the WhatsApp API
      attempts: 1,
    });
  })
}

if (process.env.NODE_ENV !== 'test') {
  initializeWorker();
}
