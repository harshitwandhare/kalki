-- AlterTable: Change vector dimensions from 1536 to 768 to match text-embedding-004
ALTER TABLE "characters" ALTER COLUMN "embedding" TYPE vector(768);
ALTER TABLE "worlds" ALTER COLUMN "embedding" TYPE vector(768);
