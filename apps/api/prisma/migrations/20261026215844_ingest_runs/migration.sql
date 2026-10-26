-- CreateTable
CREATE TABLE "IngestRun" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "source" "JobSource" NOT NULL,
    "company" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "fetched" INTEGER NOT NULL DEFAULT 0,
    "created" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "closed" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "errorDetail" TEXT,

    CONSTRAINT "IngestRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IngestRun_batchId_idx" ON "IngestRun"("batchId");

-- CreateIndex
CREATE INDEX "IngestRun_finishedAt_idx" ON "IngestRun"("finishedAt");
