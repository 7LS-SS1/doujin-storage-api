-- AlterTable
ALTER TABLE "Domain" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "vpsDetail" TEXT,
ADD COLUMN     "wpActive" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "wpDetails" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "wp_user" TEXT NOT NULL,
    "wp_password" TEXT NOT NULL,
    "domainId" INTEGER NOT NULL,

    CONSTRAINT "wpDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wpDetails_domainId_key" ON "wpDetails"("domainId");

-- AddForeignKey
ALTER TABLE "wpDetails" ADD CONSTRAINT "wpDetails_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
