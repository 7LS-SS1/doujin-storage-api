-- CreateTable
CREATE TABLE "Domain" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "webType" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "cloudflare" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);
