/*
  Warnings:

  - You are about to drop the column `status` on the `Application` table. All the data in the column will be lost.
  - Added the required column `companyName` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roleTitle` to the `Application` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ApplicationStage" AS ENUM ('SAVED', 'APPLIED', 'OA', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN');

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_jobId_fkey";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "status",
ADD COLUMN     "appliedAt" TIMESTAMP(3),
ADD COLUMN     "companyName" TEXT NOT NULL,
ADD COLUMN     "nextFollowUpAt" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "roleTitle" TEXT NOT NULL,
ADD COLUMN     "stage" "ApplicationStage" NOT NULL DEFAULT 'SAVED',
ADD COLUMN     "url" TEXT,
ALTER COLUMN "jobId" DROP NOT NULL;

-- DropEnum
DROP TYPE "ApplicationStatus";

-- CreateTable
CREATE TABLE "ApplicationEvent" (
    "id" TEXT NOT NULL,
    "fromStage" "ApplicationStage",
    "toStage" "ApplicationStage" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applicationId" TEXT NOT NULL,

    CONSTRAINT "ApplicationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationEvent_applicationId_createdAt_idx" ON "ApplicationEvent"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "Application_userId_stage_idx" ON "Application"("userId", "stage");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationEvent" ADD CONSTRAINT "ApplicationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
