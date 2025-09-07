import type { IUpsert } from "./types/bailey";
import { Queue } from "bullmq";
import { redis } from "@repo/redis";
import { QUEUE_NAME } from "./utils/constants";
import { WhatsappJob } from "@repo/types";
import { prisma } from "@repo/db";

const initAutoreply = async (upsert: IUpsert, number: string) => {
  const autoreplies = (await prisma.device.findMany({
    where: { body: number },
    include: { autoreplies: true }
  })).flatMap(device => device.autoreplies);
  const queue = new Queue<WhatsappJob>(QUEUE_NAME, {
    connection: redis
  });



  autoreplies.map((autoreply) => {
    upsert.messages.map(async (message) => {
      if (
        (
          message.message?.extendedTextMessage?.text ??
          message.message?.conversation
        )?.trim().toLowerCase() == autoreply.keyword.trim().toLowerCase() &&
        !message.key.fromMe
      ) {
        console.log(message.message?.extendedTextMessage?.text ?? message.message?.conversation, autoreply.keyword);
        // const msg: IMessage = JSON.parse(autoreply.reply);
        await queue.add('send-message', {
          type: 'send-message',
          sender: number,
          receiver: message.key.remoteJid ?? "",
          message: autoreply.reply,
          noDelay: true
        })
      }
    });
  });
};

// export const initTest = async (upsert: IUpsert, number: string) => {
//   const client = clients.get(number);
//   if (!client) {
//     console.error(`No client found for number: ${number}`);
//     return;
//   }
//   upsert.messages.map(async (message) => {
//     if (message.message?.imageMessage?.url?.length && !message.key.fromMe) {
//       // Check if message is to a group
//       if (message.key.remoteJid?.endsWith("@g.us")) {
//         return
//       }
//       console.log("Image message received:", message.message.imageMessage.url);
//       try {
//         const buffer = await downloadMediaMessage(
//           message,
//           "buffer",
//           {},
//           { logger: log, reuploadRequest: client.updateMediaMessage }
//         );
//         const form = new FormData();
//
//         form.append("file", buffer, {
//           filename: "image.jpg",
//           contentType: "image/jpeg",
//         });
//         // const res = await fetch("https://gm.milanpramod.online/predict", {
//         //   method: "POST",
//         //   headers: form.getHeaders(),
//         //   body: form,
//         // });
//         const res = await axios.post(
//           "https://gm.milanpramod.online/predict",
//           form,
//           {
//             headers: form.getHeaders(),
//           }
//         );
//         const data = await res.data
//         console.log("Prediction result:", data.result, data.confidence);
//         if (data?.result) {
//           sendBlast(
//             client,
//             message.key.remoteJid ?? "",
//             JSON.stringify({ text: generateGoodMorningMessage() }),
//             "text"
//           );
//         }
//       } catch (error) {
//         console.error("Error fetching prediction:", error);
//       }
//     }
//   });
// };
//
export default initAutoreply;
