import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config({
    path: "../../.env",
});

export const redisOptions = () => ({
    port: Number(process.env.REDIS_PORT) || 6379,
    host: process.env.REDIS_HOST || "localhost",
    maxRetriesPerRequest: null,
    db: 0, // Defaults to 0
});

const isProd = process.env.NODE_ENV === "production";

type RedisClient = Redis;

const globalForRedis = globalThis as unknown as {
    __redis?: RedisClient;
    __redisSubscriber?: RedisClient;
};

const redisInstance = globalForRedis.__redis ?? new Redis(redisOptions());
if (!isProd) globalForRedis.__redis = redisInstance;

const subscriberInstance =
    globalForRedis.__redisSubscriber ?? redisInstance.duplicate();
if (!isProd) globalForRedis.__redisSubscriber = subscriberInstance;

export const redis = redisInstance;
export const subscriber = subscriberInstance;
