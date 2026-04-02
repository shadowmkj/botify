-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'Button';

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "buttonPayload" JSONB;
