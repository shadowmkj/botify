// index.ts
import { PrismaClient } from "@prisma/client";
export * from "@prisma/client";
var prisma = new PrismaClient();
export {
  prisma
};
