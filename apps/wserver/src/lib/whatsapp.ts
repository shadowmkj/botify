import makeWASocket, { Browsers, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, WASocket } from "baileys";
import qrcode from 'qrcode-terminal';
import { deleteSessionFromRedis, useRedisAuthState } from "../auth/redis-auth";
import { redis } from "@repo/redis";
import { msgRetryCounterCache, sessions } from "../worker";
import logger from "../utils/logger";
import { Boom } from "@hapi/boom";
import { updateDeviceStatus } from "./helper";
import initAutoreply from "../autoreply";

const startingPromises = new Map<string, Promise<WASocket>>();

export async function startWhatsAppSession(
    number: string,
    fromJob: boolean = false): Promise<WASocket> {
    logger.info(`Starting WhatsApp session for: ${number}`);


    if (sessions.has(number) && !fromJob) {
        logger.info(`Session for ${number} already exists.`);
        let curr_socket = sessions.get(number);
        if (curr_socket?.ws.isOpen) {
            return sessions.get(number) as WASocket
        } else {
            sessions.delete(number)
        }
    }

    if (fromJob) {
        sessions.delete(number)
    }

    if (startingPromises.has(number)) {
        logger.warn(`Session ${number} is already in the process of starting.
                    Ignoring duplicate request.`);
        return startingPromises.get(number) as Promise<WASocket>;
    }


    const startupPromise = (async () => {
        logger.info(`Starting new Baileys session: ${number}`);
        let lastConnectionUpdate = Date.now();
        try {
            const { state, saveCreds } = await useRedisAuthState(redis, `${number}`);
            const { version } = await fetchLatestBaileysVersion();
            const sock = makeWASocket({
                version,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, logger),
                },
                browser: Browsers.macOS("Botify"),
                logger,
                connectTimeoutMs: 30000,
                keepAliveIntervalMs: 10000,
                syncFullHistory: false,
                retryRequestDelayMs: 2000,
                markOnlineOnConnect: false,
                msgRetryCounterCache,
                generateHighQualityLinkPreview: true,
            });

            // OPTIM:
            sessions.set(number, sock);

            sock.ev.on('connection.update', async (update) => {
                lastConnectionUpdate = Date.now();
                const { connection, lastDisconnect, qr } = update;
                console.log(sessions)
                if (qr) {
                    const data = {
                        qr: qr,
                        event: "QR"
                    }
                    if (connection != 'open') {
                        redis.publish(`qr:${number}`, JSON.stringify(data)).then(res => {
                            logger.info(`QR code for ${number} published to Redis channel: qr:${number},
                            result: ${res}`);
                        })
                        qrcode.generate(qr, { small: true }, (qrcode) => {
                            console.log(qrcode);
                        });
                    }
                }
                switch (connection) {
                    case 'close':
                        const statusCode = (lastDisconnect?.error as Boom)?.output.statusCode;
                        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                        if (!shouldReconnect) {
                            logger.info(`Session for ${number} logged out. Cleaning up session data.`);
                            sessions.delete(number);
                            const data = {
                                event: "LOGOUT"
                            }
                            await Promise.all([
                                deleteSessionFromRedis(redis, `${number}`),
                                updateDeviceStatus(number, "Disconnected"),
                                redis.publish(`qr:${number}`, JSON.stringify(data))
                            ])

                            startWhatsAppSession(number).catch(err => {
                                logger.error(`Failed to restart: ${number}\n Error: ${err}`)
                            })
                        }
                        else if ((lastDisconnect?.error as Boom)?.output?.statusCode === DisconnectReason.restartRequired) {
                            logger.info(`Restarting session ${number}`)
                            sessions.delete(number);
                            startWhatsAppSession(number).catch(err => {
                                logger.error(`Failed to restart: ${number}\n Error: ${err}`)
                            })
                        } else if ((lastDisconnect?.error as Boom)?.output?.statusCode === DisconnectReason.connectionReplaced) {
                            const data = {
                                event: "LOGOUT"
                            }
                            await Promise.all([
                                deleteSessionFromRedis(redis, `${number}`),
                                updateDeviceStatus(number, "Disconnected"),
                                redis.publish(`qr:${number}`, JSON.stringify(data))
                            ])
                        }
                        else {
                            logger.info(`Connection closed for ${number} (Status: ${statusCode}). Reconnecting...`);
                            startWhatsAppSession(number, true).catch(err => {
                                logger.error(`Failed to reconnect: ${number}\n Error: ${err}`)
                            });
                        }
                        break;
                    case 'open':
                        let profile = "https://avatar.iran.liara.run/public/40"
                        try {
                            profile = await sock.profilePictureUrl(sock.user?.id!) || profile
                        } catch (error) {
                            console.error("Error fetching profile picture:", error);
                        }
                        const data = {
                            event: "OPEN",
                            profile: profile
                        }

                        await Promise.all([
                            updateDeviceStatus(number, "Connected"),
                            redis.publish(`qr:${number}`, JSON.stringify(data))
                        ])

                        break;
                }
            });
            sock.ev.on('creds.update', saveCreds);
            sock.ev.on('messages.upsert', async (m) => {
                initAutoreply(m, number)
            })
            setInterval(() => {
                const silentMs = Date.now() - lastConnectionUpdate;
                if (silentMs > 120000) {
                    console.warn(`No connection activity for ${Math.round(silentMs / 1000)}s — forcing disconnect`);
                    sock.end(new Error("Zombie connection detected"));
                    sessions.delete(number)
                    Promise.all([
                        deleteSessionFromRedis(redis, `${number}`),
                        updateDeviceStatus(number, "Disconnected"),
                        redis.publish(`qr:${number}`, JSON.stringify({
                            event: "LOGOUT"
                        }))
                    ])
                }
            }, 30000);
            return sock;
        }
        catch (error) {
            logger.error(`Critical error starting session for ${number}: ${error}`);
            sessions.delete(number);
            throw error;
        }
        finally {
            startingPromises.delete(number);
        }
    })();
    startingPromises.set(number, startupPromise)
    return startupPromise
}

