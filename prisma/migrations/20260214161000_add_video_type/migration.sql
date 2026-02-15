-- CreateEnum
CREATE TYPE "VideoType" AS ENUM ('THAI_CLIP', 'AV_MOVIE');

-- AlterTable
ALTER TABLE "videos"
ADD COLUMN "type" "VideoType" NOT NULL DEFAULT 'THAI_CLIP';

-- CreateIndex
CREATE INDEX "videos_type_idx" ON "videos"("type");
