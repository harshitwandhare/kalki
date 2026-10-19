-- CreateEnum
CREATE TYPE "FarmingStatus" AS ENUM ('RUNNING', 'STOPPED', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "farming_runs" (
    "id" TEXT NOT NULL,
    "status" "FarmingStatus" NOT NULL DEFAULT 'STOPPED',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stoppedAt" TIMESTAMP(3),
    "logs" JSONB NOT NULL DEFAULT '[]',
    "triggeredById" TEXT NOT NULL,

    CONSTRAINT "farming_runs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "farming_runs" ADD CONSTRAINT "farming_runs_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
