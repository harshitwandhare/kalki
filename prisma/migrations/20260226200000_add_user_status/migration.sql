-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'PENDING';

-- Set existing users to ACTIVE (they were created before this system)
UPDATE "users" SET "status" = 'ACTIVE';

-- AlterTable: change default role for new users to VIEWER
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'VIEWER';
