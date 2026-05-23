import makeWASocket, { Browsers, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, WASocket } from "baileys";
import qrcode from 'qrcode-terminal';
import { deleteSessionFromRedis, useRedisAuthState } from "../auth/redis-auth";
import { redis } from "@repo/redis";
import { msgRetryCounterCache, sessions } from "../worker";
import logger from "../utils/logger";
import { Boom } from "@hapi/boom";
import { updateDeviceStatus } from "./helper";
import initAutoreply from "../autoreply";
import { wrapWithSessionStability, LidResolver } from 'baileys-antiban';

const startingPromises = new Map<string, Promise<WASocket>>();
const resolver = new LidResolver({ canonical: 'pn' });


export async function startWhatsAppSession(
    number: string,
    fromJob: boolean = false): Promise<WASocket> {
    logger.info(`Starting WhatsApp session for: ${number}`);

    // Reuse existing session if the WebSocket is still open (works in all environments)
    if (sessions.has(number) && !fromJob) {
        logger.info(`Session for ${number} already exists.`);
        const curr_socket = sessions.get(number);
        if (curr_socket?.ws.isOpen) {
            return curr_socket;
        } else {
            // Socket exists but is dead — clean it up before recreating
            logger.info(`Session for ${number} exists but socket is closed. Cleaning up.`);
            sessions.delete(number);
        }
    }

    // If called from a BullMQ job, close the old socket gracefully before recreating
    if (fromJob && sessions.has(number)) {
        const oldSock = sessions.get(number);
        try {
            oldSock?.end(undefined);
        } catch (e) {
            // ignore — socket may already be dead
        }
        sessions.delete(number);
    }

    if (startingPromises.has(number)) {
        logger.warn(`Session ${number} is already in the process of starting. Ignoring duplicate request.`);
        return startingPromises.get(number) as Promise<WASocket>;
    }

    const startupPromise = (async () => {
        logger.info(`Starting new Baileys session: ${number}`);
        try {
            const { state, saveCreds } = await useRedisAuthState(redis, `${number}`);
            const { version } = await fetchLatestBaileysVersion();
            const baseSock = makeWASocket({
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

            const sock = wrapWithSessionStability(baseSock, {
                canonicalJidNormalization: true,  // Auto-canonicalize JIDs before sendMessage
                healthMonitoring: true,           // Auto-track decrypt health
                lidResolver: resolver,
                health: {
                    badMacThreshold: 3,
                    badMacWindowMs: 60_000,
                    onDegraded: (stats) => console.error('Session degraded!'),
                },
            });

            sessions.set(number, sock);

            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    const data = {
                        qr: qr,
                        event: "QR"
                    }
                    if (connection != 'open') {
                        redis.publish(`qr:${number}`, JSON.stringify(data)).then(res => {
                            logger.info(`QR code for ${number} published to Redis channel: qr:${number}, result: ${res}`);
                        })
                        qrcode.generate(qr, { small: true }, (qrcode) => {
                            console.log(qrcode);
                        });
                    }
                }

                switch (connection) {
                    case 'close':
                        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
                        logger.info(`Connection closed for ${number} (Status: ${statusCode})`);

                        if (statusCode === DisconnectReason.loggedOut) {
                            // User explicitly logged out — wipe auth and notify frontend
                            logger.info(`Session for ${number} logged out. Cleaning up session data.`);
                            sessions.delete(number);
                            await Promise.all([
                                deleteSessionFromRedis(redis, `${number}`),
                                updateDeviceStatus(number, "Disconnected"),
                                redis.publish(`qr:${number}`, JSON.stringify({ event: "LOGOUT" }))
                            ]);
                            // Don't auto-restart after logout; user must re-scan intentionally
                        }
                        else if (statusCode === DisconnectReason.connectionReplaced) {
                            // Another socket took over (e.g. hot-reload or duplicate start)
                            // Auth state is still valid — do NOT delete from Redis
                            logger.info(`Connection replaced for ${number}. Auth state preserved.`);
                            sessions.delete(number);
                            await updateDeviceStatus(number, "Disconnected");
                        }
                        else if (statusCode === DisconnectReason.restartRequired) {
                            logger.info(`Restart required for session ${number}`);
                            sessions.delete(number);
                            startWhatsAppSession(number).catch(err => {
                                logger.error(`Failed to restart: ${number}\n Error: ${err}`)
                            });
                        }
                        else {
                            // Any other close reason — reconnect using existing auth
                            logger.info(`Reconnecting session ${number}...`);
                            sessions.delete(number);
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

                        await Promise.all([
                            updateDeviceStatus(number, "Connected"),
                            redis.publish(`qr:${number}`, JSON.stringify({
                                event: "OPEN",
                                profile: profile
                            }))
                        ]);
                        break;
                }
            });

            sock.ev.on('creds.update', saveCreds);
            sock.ev.on('messages.upsert', async (m) => {
                initAutoreply(m, number)
            });

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

    startingPromises.set(number, startupPromise);
    return startupPromise;
}

/**
 * Gracefully close all active sessions.
 * Called on process exit to prevent orphaned connections
 * that cause "connectionReplaced" on restart.
 */
export function gracefulShutdown() {
    logger.info(`Graceful shutdown: closing ${sessions.size} session(s)...`);
    for (const [number, sock] of sessions) {
        try {
            sock.end(undefined);
            logger.info(`Closed session for ${number}`);
        } catch (e) {
            // ignore
        }
    }
    sessions.clear();
}

// Register shutdown handlers
process.on('SIGTERM', () => { gracefulShutdown(); process.exit(0); });
process.on('SIGINT', () => { gracefulShutdown(); process.exit(0); });
