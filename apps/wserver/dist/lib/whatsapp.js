"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWhatsAppSession = startWhatsAppSession;
const baileys_1 = __importStar(require("baileys"));
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
const redis_auth_1 = require("../auth/redis-auth");
const redis_1 = require("../utils/redis");
const worker_1 = require("../worker");
const logger_1 = __importDefault(require("../utils/logger"));
const helper_1 = require("./helper");
const autoreply_1 = __importDefault(require("../autoreply"));
async function startWhatsAppSession(number) {
    logger_1.default.info(`Starting WhatsApp session for: ${number}`);
    if (worker_1.sessions.has(number)) {
        logger_1.default.info(`Session for ${number} already exists.`);
        worker_1.sessions.delete(number);
    }
    logger_1.default.info(`Starting new Baileys session: ${number}`);
    const { state, saveCreds } = await (0, redis_auth_1.useRedisAuthState)(redis_1.redis, `${number}`);
    const { version } = await (0, baileys_1.fetchLatestBaileysVersion)();
    const sock = (0, baileys_1.default)({
        version,
        logger: logger_1.default,
        auth: {
            creds: state.creds,
            keys: (0, baileys_1.makeCacheableSignalKeyStore)(state.keys, logger_1.default),
        },
        markOnlineOnConnect: false,
        msgRetryCounterCache: worker_1.msgRetryCounterCache,
        generateHighQualityLinkPreview: true,
    });
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            const data = {
                qr: qr,
                event: "QR"
            };
            if (connection != 'open') {
                const res = await redis_1.redis.publish(`qr:${number}`, JSON.stringify(data));
                console.log(qr);
                logger_1.default.info(`QR code for ${number} published to Redis channel: qr:${number}, result: ${res}`);
                qrcode_terminal_1.default.generate(qr, { small: true }, (qrcode) => {
                    console.log(qrcode);
                });
            }
        }
        switch (connection) {
            case 'close':
                const statusCode = lastDisconnect?.error?.output.statusCode;
                // const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                worker_1.sessions.delete(number);
                await (0, helper_1.updateDeviceStatus)(number, "Disconnected");
                if (lastDisconnect?.error?.output?.statusCode === baileys_1.DisconnectReason.restartRequired) {
                    await startWhatsAppSession(number);
                }
                if (statusCode === baileys_1.DisconnectReason.loggedOut) {
                    await (0, redis_auth_1.deleteSessionFromRedis)(redis_1.redis, `${number}`);
                    const data = {
                        event: "LOGOUT"
                    };
                    await (0, helper_1.updateDeviceStatus)(number, "Disconnected");
                    const res = await redis_1.redis.publish(`qr:${number}`, JSON.stringify(data));
                    await startWhatsAppSession(number);
                }
                break;
            case 'connecting':
                await (0, helper_1.updateDeviceStatus)(number, "Disconnected");
                break;
            case 'open':
                let data;
                try {
                    const profile = await sock.profilePictureUrl(sock.user?.id);
                    data = {
                        event: "OPEN",
                        profile: profile,
                    };
                }
                catch (error) {
                    console.error("Error fetching profile picture:", error);
                    data = {
                        event: "OPEN",
                        profile: "https://avatar.iran.liara.run/public/40",
                    };
                }
                await (0, helper_1.updateDeviceStatus)(number, "Connected");
                const res = await redis_1.redis.publish(`qr:${number}`, JSON.stringify(data));
                if (!worker_1.sessions.get(number)) {
                    worker_1.sessions.set(number, sock);
                }
                break;
        }
    });
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('messages.upsert', async (m) => {
        const i = await sock.groupFetchAllParticipating();
        (0, autoreply_1.default)(m, number);
    });
    return sock;
}
