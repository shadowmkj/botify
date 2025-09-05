"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/worker.ts
var worker_exports = {};
__export(worker_exports, {
  msgRetryCounterCache: () => msgRetryCounterCache,
  sessions: () => sessions
});
module.exports = __toCommonJS(worker_exports);
var import_db3 = require("@repo/db");
var import_types2 = require("@repo/types");
var import_bullmq3 = require("bullmq");
var import_node_cache = __toESM(require("node-cache"));

// src/lib/whatsapp.ts
var import_baileys2 = __toESM(require("baileys"));
var import_qrcode_terminal = __toESM(require("qrcode-terminal"));

// src/auth/redis-auth.ts
var import_baileys = require("baileys");
var useRedisAuthState = async (redis2, sessionKey) => {
  const getKey = (file) => `${sessionKey}:${file}`;
  const writeData = async (data, file) => {
    const key = getKey(file);
    const dataStr = JSON.stringify(data, import_baileys.BufferJSON.replacer);
    await redis2.set(key, dataStr);
  };
  const readData = async (file) => {
    const key = getKey(file);
    const dataStr = await redis2.get(key);
    if (dataStr) {
      return JSON.parse(dataStr, import_baileys.BufferJSON.reviver);
    }
    return null;
  };
  const removeData = async (file) => {
    const key = getKey(file);
    await redis2.del(key);
  };
  const creds = await readData("creds.json") || (0, import_baileys.initAuthCreds)();
  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}.json`);
              if (type === "app-state-sync-key" && value) {
                value = import_baileys.proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const file = `${category}-${id}.json`;
              if (value) {
                tasks.push(writeData(value, file));
              } else {
                tasks.push(removeData(file));
              }
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    saveCreds: async () => {
      return writeData(creds, "creds.json");
    }
  };
};
async function deleteSessionFromRedis(redis2, sessionId) {
  let cursor = 0;
  let keys = [];
  do {
    const reply = await redis2.scan(cursor, "MATCH", `${sessionId}:*`, "COUNT", 1e3);
    keys.push(...reply[1]);
  } while (cursor !== 0);
  console.log(`Deleting keys for session ${sessionId}:`, keys);
  await redis2.del(keys);
}

// src/utils/redis.ts
var import_bullmq = require("bullmq");
var import_ioredis = __toESM(require("ioredis"));
var redis = new import_ioredis.default({
  port: 6379,
  host: "localhost",
  db: 0,
  // Defaults to 0
  maxRetriesPerRequest: null
});
var redisSubscriber = new import_ioredis.default({
  port: 6379,
  host: "localhost",
  db: 0,
  // Defaults to 0
  maxRetriesPerRequest: null
});
var blastQueue = new import_bullmq.Queue("blast", { connection: redis });

// src/utils/logger.ts
var import_pino = __toESM(require("pino"));
var import_dayjs = __toESM(require("dayjs"));
var log = (0, import_pino.default)({
  transport: {
    target: "pino-pretty"
  },
  enabled: process.env.NODE_ENV !== "production",
  base: {
    pid: false
  },
  timestamp: () => `,"time":"${(0, import_dayjs.default)().format()}"`
});
var logger_default = log;

// src/lib/helper.ts
var import_types = require("@repo/types");
var import_db = require("@repo/db");
var updateDeviceStatus = async (number, status) => {
  const { data: validatedNumber, success } = import_types.phoneNumberSchema.safeParse(number);
  if (!success) {
    throw new Error(`Invalid phone number format: ${number}`);
  }
  const update = await import_db.prisma.device.update({
    data: {
      status
    },
    where: {
      body: validatedNumber
    }
  });
  if (!update) {
    throw new Error(`Failed to update device status for ${number}`);
  }
  return update;
};

// src/autoreply.ts
var import_bullmq2 = require("bullmq");

// src/utils/constants.ts
var QUEUE_NAME = "whatsapp-jobs";

// src/autoreply.ts
var import_db2 = require("@repo/db");
var initAutoreply = async (upsert, number) => {
  const autoreplies = (await import_db2.prisma.device.findMany({
    where: { body: number },
    include: { autoreplies: true }
  })).flatMap((device) => device.autoreplies);
  const queue2 = new import_bullmq2.Queue(QUEUE_NAME, {
    connection: redis
  });
  autoreplies.map((autoreply) => {
    upsert.messages.map(async (message) => {
      if ((message.message?.extendedTextMessage?.text ?? message.message?.conversation)?.trim().toLowerCase() == autoreply.keyword.trim().toLowerCase() && !message.key.fromMe) {
        console.log(message.message?.extendedTextMessage?.text ?? message.message?.conversation, autoreply.keyword);
        await queue2.add("send-message", {
          type: "send-message",
          sender: number,
          receiver: message.key.remoteJid ?? "",
          message: autoreply.reply,
          noDelay: true
        });
      }
    });
  });
};
var autoreply_default = initAutoreply;

// src/lib/whatsapp.ts
async function startWhatsAppSession(number) {
  logger_default.info(`Starting WhatsApp session for: ${number}`);
  if (sessions.has(number)) {
    logger_default.info(`Session for ${number} already exists.`);
    sessions.delete(number);
  }
  logger_default.info(`Starting new Baileys session: ${number}`);
  const { state, saveCreds } = await useRedisAuthState(redis, `${number}`);
  const { version } = await (0, import_baileys2.fetchLatestBaileysVersion)();
  const sock = (0, import_baileys2.default)({
    version,
    logger: logger_default,
    auth: {
      creds: state.creds,
      keys: (0, import_baileys2.makeCacheableSignalKeyStore)(state.keys, logger_default)
    },
    markOnlineOnConnect: false,
    msgRetryCounterCache,
    generateHighQualityLinkPreview: true
  });
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      const data = {
        qr,
        event: "QR"
      };
      if (connection != "open") {
        const res = await redis.publish(`qr:${number}`, JSON.stringify(data));
        console.log(qr);
        logger_default.info(`QR code for ${number} published to Redis channel: qr:${number}, result: ${res}`);
        import_qrcode_terminal.default.generate(qr, { small: true }, (qrcode2) => {
          console.log(qrcode2);
        });
      }
    }
    switch (connection) {
      case "close":
        const statusCode = lastDisconnect?.error?.output.statusCode;
        sessions.delete(number);
        await updateDeviceStatus(number, "Disconnected");
        if (lastDisconnect?.error?.output?.statusCode === import_baileys2.DisconnectReason.restartRequired) {
          await startWhatsAppSession(number);
        }
        if (statusCode === import_baileys2.DisconnectReason.loggedOut) {
          await deleteSessionFromRedis(redis, `${number}`);
          const data2 = {
            event: "LOGOUT"
          };
          await updateDeviceStatus(number, "Disconnected");
          const res2 = await redis.publish(`qr:${number}`, JSON.stringify(data2));
          await startWhatsAppSession(number);
        }
        break;
      case "connecting":
        await updateDeviceStatus(number, "Disconnected");
        break;
      case "open":
        let data;
        try {
          const profile = await sock.profilePictureUrl(sock.user?.id);
          data = {
            event: "OPEN",
            profile
          };
        } catch (error) {
          console.error("Error fetching profile picture:", error);
          data = {
            event: "OPEN",
            profile: "https://avatar.iran.liara.run/public/40"
          };
        }
        await updateDeviceStatus(number, "Connected");
        const res = await redis.publish(`qr:${number}`, JSON.stringify(data));
        if (!sessions.get(number)) {
          sessions.set(number, sock);
        }
        break;
    }
  });
  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("messages.upsert", async (m) => {
    const i = await sock.groupFetchAllParticipating();
    autoreply_default(m, number);
  });
  return sock;
}

// src/utils/common.ts
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// src/worker.ts
var sessions = /* @__PURE__ */ new Map();
var msgRetryCounterCache = new import_node_cache.default();
var queue = new import_bullmq3.Queue(QUEUE_NAME, {
  connection: redis
});
new import_bullmq3.Worker(QUEUE_NAME, async (job) => {
  logger_default.info(`Processing job: ${job.name} for session: ${job.data.sender}`);
  switch (job.data.type) {
    case "connect-whatsapp": {
      await startWhatsAppSession(job.data.sender);
      break;
    }
    case "send-message": {
      const { sender, receiver, message, blastId, noDelay = false } = job.data;
      const { success, data: validatedSender } = import_types2.phoneNumberSchema.safeParse(sender);
      if (success === false) {
        logger_default.error(`Invalid sender number: ${sender}`);
        break;
      }
      const sock = sessions.get(validatedSender);
      if (sock) {
        try {
          console.log(`Sending message to ${receiver} from session ${validatedSender}`);
          if (!noDelay) {
            const randomDelay = Math.floor(Math.random() * 1e3) + 500;
            await sleep(randomDelay);
          }
          const result = await sock.onWhatsApp(receiver);
          const response = await sock.sendMessage(result ? result[0].jid : "", {
            text: message
          });
          if (response) {
            await import_db3.prisma.device.update({
              data: {
                messagesSent: {
                  increment: 1
                }
              },
              where: {
                body: validatedSender
              }
            });
            if (blastId) {
              const blast = await import_db3.prisma.blast.update({
                where: {
                  id: blastId
                },
                data: {
                  status: "Sent"
                }
              });
            }
          }
          console.log(sock, result, response);
        } catch (error) {
          console.error("Failed to send message:", error);
          if (blastId) {
            const blast = await import_db3.prisma.blast.update({
              where: {
                id: blastId
              },
              data: {
                status: "Failed"
              }
            });
          }
          throw error;
        }
      } else {
        console.error(`Session ${sender} not found. Cannot send message.`);
        throw new Error(`Session ${sender} not found. Cannot send message.`);
      }
      break;
    }
    case "logout": {
      const { sender } = job.data;
      const { success, data: validatedSender } = import_types2.phoneNumberSchema.safeParse(sender);
      if (success === false) {
        logger_default.error(`Invalid sender number: ${sender}`);
        break;
      }
      const sock = sessions.get(validatedSender);
      if (sock) {
        await sock.logout();
      }
      break;
    }
    case "campaign": {
      const { sender, campaignId } = job.data;
      const campaign = await import_db3.prisma.campaign.findFirst({
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
      });
      if (!campaign) {
        break;
      }
      await queue.addBulk(
        campaign.blasts.map((blast) => {
          return {
            name: "send-message",
            data: {
              type: "send-message",
              sender,
              receiver: blast.contact.phone,
              blastId: blast.id,
              message: campaign.message ?? "Default"
            },
            opts: {
              attempts: 3,
              removeOnComplete: true,
              removeOnFail: true
            }
          };
        })
      );
    }
  }
}, {
  connection: redis,
  removeOnComplete: {
    age: 0
  },
  removeOnFail: {
    age: 0
  }
});
async function initializeWorker() {
  logger_default.info("WhatsApp worker initialized");
  const numbers = await import_db3.prisma.device.findMany();
  numbers.forEach((number) => {
    queue.add("connect-whatsapp", { sender: number.body, type: "connect-whatsapp" }, {
      delay: 1e3,
      // Delay to avoid overwhelming the WhatsApp API
      attempts: 1
    });
  });
}
if (process.env.NODE_ENV !== "test") {
  initializeWorker();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  msgRetryCounterCache,
  sessions
});
