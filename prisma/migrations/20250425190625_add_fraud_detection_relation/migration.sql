/*
  Warnings:

  - You are about to drop the column `disputeId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `ownerPaidOut` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `ownerPaidOutAmount` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `platformFee` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `rentalAmount` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `securityDepositAmount` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `securityDepositReturned` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `stripeId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `stripeTransferId` on the `Payment` table. All the data in the column will be lost.
  - The `status` column on the `Rental` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[stripeChargeId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `status` on the `Payment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'BLOCKED', 'RETRY_SCHEDULED');

-- CreateEnum
CREATE TYPE "RentalStatus" AS ENUM ('PENDING', 'PAID', 'PAYMENT_FAILED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_rentalId_fkey";

-- DropIndex
DROP INDEX "Payment_disputeId_key";

-- DropIndex
DROP INDEX "Payment_stripeId_key";

-- DropIndex
DROP INDEX "Payment_stripeTransferId_key";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "disputeId",
DROP COLUMN "ownerPaidOut",
DROP COLUMN "ownerPaidOutAmount",
DROP COLUMN "paymentMethod",
DROP COLUMN "platformFee",
DROP COLUMN "rentalAmount",
DROP COLUMN "securityDepositAmount",
DROP COLUMN "securityDepositReturned",
DROP COLUMN "stripeId",
DROP COLUMN "stripeTransferId",
ADD COLUMN     "blockReason" TEXT,
ADD COLUMN     "failedAt" TIMESTAMP(3),
ADD COLUMN     "fraudScore" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastRetryAt" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "nextRetryAt" TIMESTAMP(3),
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stripeChargeId" TEXT,
ADD COLUMN     "userAgent" TEXT,
ADD COLUMN     "velocityScore" DOUBLE PRECISION DEFAULT 0,
ALTER COLUMN "currency" DROP DEFAULT,
DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL,
ALTER COLUMN "rentalId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Rental" DROP COLUMN "status",
ADD COLUMN     "status" "RentalStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "PaymentAnalytics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalTransactions" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "peakHour" INTEGER,
    "equipmentId" TEXT,

    CONSTRAINT "PaymentAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudDetection" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "lastAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockExpiresAt" TIMESTAMP(3),
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "userId" TEXT,

    CONSTRAINT "FraudDetection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "auth" TEXT,
    "p256dh" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentAnalytics_date_idx" ON "PaymentAnalytics"("date");

-- CreateIndex
CREATE INDEX "PaymentAnalytics_equipmentId_idx" ON "PaymentAnalytics"("equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAnalytics_date_equipmentId_key" ON "PaymentAnalytics"("date", "equipmentId");

-- CreateIndex
CREATE INDEX "FraudDetection_userId_idx" ON "FraudDetection"("userId");

-- CreateIndex
CREATE INDEX "FraudDetection_lastAttemptAt_idx" ON "FraudDetection"("lastAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "FraudDetection_ipAddress_key" ON "FraudDetection"("ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeChargeId_key" ON "Payment"("stripeChargeId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE INDEX "Payment_ipAddress_idx" ON "Payment"("ipAddress");

-- CreateIndex
CREATE INDEX "Rental_equipmentId_idx" ON "Rental"("equipmentId");

-- CreateIndex
CREATE INDEX "Rental_renterId_idx" ON "Rental"("renterId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAnalytics" ADD CONSTRAINT "PaymentAnalytics_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudDetection" ADD CONSTRAINT "FraudDetection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
