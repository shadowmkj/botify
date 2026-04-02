import { AuthenticationCreds, AuthenticationState, BufferJSON, initAuthCreds, proto, SignalDataTypeMap } from "baileys";
import Redis from "ioredis";

/**
 * Stores the full authentication state in a Redis instance.
 *
 * @param redis The Redis client instance
 * @param sessionKey A prefix to use for all keys in Redis for this session, e.g., 'baileys-session'
 */
export const useRedisAuthState = async (
    redis: Redis,
    sessionKey: string
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> => {
    const getKey = (file: string) => `${sessionKey}:${file}`;
    const writeData = async (data: any, file: string) => {
        const key = getKey(file);
        // Use JSON.stringify with the BufferJSON replacer to serialize the data
        const dataStr = JSON.stringify(data, BufferJSON.replacer);
        await redis.set(key, dataStr);
    }

    const readData = async (file: string) => {
        const key = getKey(file);
        const dataStr = await redis.get(key);
        if (dataStr) {
            return JSON.parse(dataStr, BufferJSON.reviver);
        }
        return null;
    }

    const removeData = async (file: string) => {
        const key = getKey(file);
        await redis.del(key);
    }

    // Load credentials from Redis or initialize them
    const creds: AuthenticationCreds = (await readData('creds.json')) || initAuthCreds();
    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data: { [_: string]: SignalDataTypeMap[typeof type] } = {};
                    await Promise.all(
                        ids.map(async id => {
                            let value = await readData(`${type}-${id}.json`);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async data => {
                    const tasks: Promise<void>[] = [];
                    for (const category in data) {
                        for (const id in data[category as keyof SignalDataTypeMap]) {
                            const value = data[category as keyof SignalDataTypeMap]![id];
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
            return writeData(creds, 'creds.json');
        }
    };
}

/**
 * Finds and deletes all Redis keys associated with a session ID.
 * @param {RedisClientType} redis - The Redis client instance.
 * @param {string} sessionId - The session ID to clear.
 */
export async function deleteSessionFromRedis(redis: Redis, sessionId: string) {
    let cursor = 0;
    let keys: string[] = [];
    do {
        // Scan for keys matching the session pattern
        const reply = await redis.scan(cursor, "MATCH", `${sessionId}:*`, "COUNT", 1000);
        keys.push(...reply[1]);
    } while (cursor !== 0);
    console.log(`Deleting keys for session ${sessionId}:`, keys);
    if (keys.length > 0) {
        await redis.del(keys); // Delete all found keys
    }
}

