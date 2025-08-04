-- CreateTable
CREATE TABLE "public"."LotteryRound" (
    "id" SERIAL NOT NULL,
    "round_date" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "LotteryRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PrizeType" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "digits" INTEGER NOT NULL,

    CONSTRAINT "PrizeType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LotteryResult" (
    "id" SERIAL NOT NULL,
    "numbers" JSONB NOT NULL,
    "prizeTypeId" INTEGER NOT NULL,
    "roundId" INTEGER NOT NULL,

    CONSTRAINT "LotteryResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LotteryRound_round_date_key" ON "public"."LotteryRound"("round_date");

-- CreateIndex
CREATE UNIQUE INDEX "PrizeType_code_key" ON "public"."PrizeType"("code");

-- AddForeignKey
ALTER TABLE "public"."LotteryResult" ADD CONSTRAINT "LotteryResult_prizeTypeId_fkey" FOREIGN KEY ("prizeTypeId") REFERENCES "public"."PrizeType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LotteryResult" ADD CONSTRAINT "LotteryResult_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "public"."LotteryRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
