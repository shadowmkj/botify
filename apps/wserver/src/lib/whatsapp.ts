import makeWASocket, { DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, WASocket } from "baileys";
import qrcode from 'qrcode-terminal';
import { deleteSessionFromRedis, useRedisAuthState } from "../auth/redis-auth";
import { redis } from "../utils/redis";
import { msgRetryCounterCache, sessions } from "../worker";
import logger from "../utils/logger";
import { Boom } from "@hapi/boom";
import { prisma } from '@repo/db'
import { updateDeviceStatus } from "./helper";
import initAutoreply from "../autoreply";

export async function startWhatsAppSession(number: string): Promise<WASocket> {
  logger.info(`Starting WhatsApp session for: ${number}`);
  if (sessions.has(number)) {
    logger.info(`Session for ${number} already exists.`);
    sessions.delete(number)
  }
  logger.info(`Starting new Baileys session: ${number}`);
  const { state, saveCreds } = await useRedisAuthState(redis, `${number}`);
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    markOnlineOnConnect: false,
    msgRetryCounterCache,
    generateHighQualityLinkPreview: true,
  });
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      const data = {
        qr: qr,
        event: "QR"
      }
      if (connection != 'open') {
        const res = await redis.publish(`qr:${number}`, JSON.stringify(data));
        console.log(qr)
        logger.info(`QR code for ${number} published to Redis channel: qr:${number}, result: ${res}`);
        qrcode.generate(qr, { small: true }, (qrcode) => {
          console.log(qrcode);
        });
      }
    }
    switch (connection) {
      case 'close':
        const statusCode = (lastDisconnect?.error as Boom)?.output.statusCode;
        // const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        sessions.delete(number);
        await updateDeviceStatus(number, "Disconnected");
        if ((lastDisconnect?.error as Boom)?.output?.statusCode === DisconnectReason.restartRequired) {
          await startWhatsAppSession(number);
        }
        if (statusCode === DisconnectReason.loggedOut) {
          await deleteSessionFromRedis(redis, `${number}`);
          const data = {
            event: "LOGOUT"
          }
          await updateDeviceStatus(number, "Disconnected");
          const res = await redis.publish(`qr:${number}`, JSON.stringify(data));
          await startWhatsAppSession(number)
        }
        break;
      case 'connecting':
        await updateDeviceStatus(number, "Disconnected");
        break;
      case 'open':
        let data;
        try {
          const profile = await sock.profilePictureUrl(sock.user?.id!)
          data = {
            event: "OPEN",
            profile: profile,
          }
        } catch (error) {
          console.error("Error fetching profile picture:", error);
          data = {
            event: "OPEN",
            profile: "https://avatar.iran.liara.run/public/40",
          }
        }
        await updateDeviceStatus(number, "Connected");
        const res = await redis.publish(`qr:${number}`, JSON.stringify(data));
        if (!sessions.get(number)) {
          sessions.set(number, sock);
        }
        break;
    }
  });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('messages.upsert', async (m) => {
    initAutoreply(m, number)
  })
  return sock;
}

