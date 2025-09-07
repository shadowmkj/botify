import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config({
  path: '../../.env'
});
export const redis = new Redis({
  port: Number(process.env.REDIS_PORT) || 6379,
  host: process.env.REDIS_HOST || "redis",
  // password: process.env.REDIS_PASSWORD,
  db: 0, // Defaults to 0
  maxRetriesPerRequest: null
})

export const subscriber = new Redis({
  port: Number(process.env.REDIS_PORT) || 6379,
  host: process.env.REDIS_HOST || "redis",
  // password: process.env.REDIS_PASSWORD,
  db: 0, // Defaults to 0
  maxRetriesPerRequest: null
})
// export const redis = new Redis({
//   port: Number(process.env.REDIS_PORT) || 6379, // Defaults to 6379
//   host: process.env.REDIS_HOST,
//   username: process.env.REDIS_USERNAME,
//   password: process.env.REDIS_PASSWORD,
//   db: 0, // Defaults to 0
//   maxRetriesPerRequest: null
// })
// export const redis = new Redis({
//   port: 19327,
//   host: "redis-19327.c212.ap-south-1-1.ec2.redns.redis-cloud.com",
//   username: "default",
//   password: "O3dtw8l8mkxs7iJGz2JQLxwHainPsQch",
//   db: 0, // Defaults to 0
//   maxRetriesPerRequest: null
// })
//
//
// export const subscriber = new Redis({
//   port: 19327,
//   host: "redis-19327.c212.ap-south-1-1.ec2.redns.redis-cloud.com",
//   username: "default",
//   password: "O3dtw8l8mkxs7iJGz2JQLxwHainPsQch",
//   db: 0, // Defaults to 0
//   maxRetriesPerRequest: null
// })



