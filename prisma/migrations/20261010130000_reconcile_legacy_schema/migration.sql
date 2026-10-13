-- Schema expansion for current JackerBox models. Retains legacy financial records and messages.
-- Production data must be reviewed before this migration; unrecognized statuses fail closed.

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'BLOCKED', 'RETRY_SCHEDULED');


-- CreateEnum
CREATE TYPE "RentalStatus" AS ENUM ('PENDING', 'PAID', 'PAYMENT_FAILED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REFUNDED');


-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "availabilitySchedule" JSONB DEFAULT '{}',
ADD COLUMN     "blackoutDates" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[];


-- Preserve historical messages and copy recipient ownership without dropping old fields.
ALTER TABLE "Message"
  ADD COLUMN "bookingId" TEXT,
  ADD COLUMN "equipmentId" TEXT,
  ADD COLUMN "recipientId" TEXT;
UPDATE "Message" SET "recipientId" = "receiverId" WHERE "recipientId" IS NULL;
ALTER TABLE "Message" ALTER COLUMN "recipientId" SET NOT NULL;
-- New inserts use recipientId, so legacy receiverId must no longer be required.
ALTER TABLE "Message" ALTER COLUMN "receiverId" DROP NOT NULL;

-- Keep all legacy payment audit/transfer/refund fields for reconciliation.
ALTER TABLE "Payment"
  ADD COLUMN "blockReason" TEXT,
  ADD COLUMN "failedAt" TIMESTAMP(3),
  ADD COLUMN "fraudScore" DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN "ipAddress" TEXT,
  ADD COLUMN "isBlocked" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "lastRetryAt" TIMESTAMP(3),
  ADD COLUMN "metadata" JSONB,
  ADD COLUMN "nextRetryAt" TIMESTAMP(3),
  ADD COLUMN "paidAt" TIMESTAMP(3),
  ADD COLUMN "refundedAt" TIMESTAMP(3),
  ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "stripeChargeId" TEXT,
  ADD COLUMN "userAgent" TEXT,
  ADD COLUMN "velocityScore" DOUBLE PRECISION DEFAULT 0;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "Payment" WHERE UPPER(TRIM("status")) NOT IN
     ('PENDING','COMPLETED','FAILED','REFUNDED','BLOCKED','RETRY_SCHEDULED')) THEN
    RAISE EXCEPTION 'Unrecognized legacy payment status; reconcile payments before migrating';
  END IF;
END $$;
ALTER TABLE "Payment" ALTER COLUMN "status" TYPE "PaymentStatus" USING UPPER(TRIM("status"))::"PaymentStatus";
ALTER TABLE "Payment" ALTER COLUMN "rentalId" DROP NOT NULL;
-- Carry verified historic transfer/refund state into the new metadata keys.
-- A true legacy flag blocks reissuing money when the old record lacks an external ID.
UPDATE "Payment"
SET "metadata" = COALESCE("metadata", '{}'::jsonb)
  || CASE WHEN "ownerPaidOut" IS TRUE OR "stripeTransferId" IS NOT NULL
     THEN jsonb_build_object('legacyOwnerPayoutRecorded', true) ELSE '{}'::jsonb END
  || CASE WHEN "stripeTransferId" IS NOT NULL
     THEN jsonb_build_object('ownerPayoutTransferId', "stripeTransferId") ELSE '{}'::jsonb END
  || CASE WHEN "securityDepositReturned" IS TRUE
     THEN jsonb_build_object('legacySecurityDepositRefundRecorded', true) ELSE '{}'::jsonb END
WHERE "ownerPaidOut" IS TRUE
   OR "stripeTransferId" IS NOT NULL
   OR "securityDepositReturned" IS TRUE;


-- Do not falsely treat unconfirmed legacy rentals as paid. Unsupported statuses block deployment.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "Rental" WHERE UPPER(TRIM("status")) NOT IN
    ('PENDING','PAID','PAYMENT_FAILED','ACTIVE','COMPLETED','CANCELLED','REFUNDED')) THEN
    RAISE EXCEPTION 'Unrecognized legacy rental status; reconcile historical bookings before migrating';
  END IF;
END $$;
ALTER TABLE "Rental"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "RentalStatus" USING UPPER(TRIM("status"))::"RentalStatus",
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "renterId" TEXT NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
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


-- CreateIndex
CREATE INDEX "Booking_equipmentId_idx" ON "Booking"("equipmentId");


-- CreateIndex
CREATE INDEX "Booking_renterId_idx" ON "Booking"("renterId");


-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");


-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");


-- CreateIndex
CREATE UNIQUE INDEX "FraudDetection_ipAddress_key" ON "FraudDetection"("ipAddress");


-- CreateIndex
CREATE INDEX "FraudDetection_lastAttemptAt_idx" ON "FraudDetection"("lastAttemptAt");


-- CreateIndex
CREATE INDEX "FraudDetection_userId_idx" ON "FraudDetection"("userId");


-- CreateIndex
CREATE INDEX "PaymentAnalytics_date_idx" ON "PaymentAnalytics"("date");


-- CreateIndex
CREATE INDEX "PaymentAnalytics_equipmentId_idx" ON "PaymentAnalytics"("equipmentId");


-- CreateIndex
CREATE UNIQUE INDEX "PaymentAnalytics_date_equipmentId_key" ON "PaymentAnalytics"("date", "equipmentId");


-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");


-- CreateIndex
CREATE INDEX "Message_recipientId_idx" ON "Message"("recipientId");


-- CreateIndex
CREATE INDEX "Message_equipmentId_idx" ON "Message"("equipmentId");


-- CreateIndex
CREATE INDEX "Message_bookingId_idx" ON "Message"("bookingId");


-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeChargeId_key" ON "Payment"("stripeChargeId");


-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");


-- CreateIndex
CREATE INDEX "Payment_ipAddress_idx" ON "Payment"("ipAddress");


-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");


-- CreateIndex
CREATE INDEX "Rental_equipmentId_idx" ON "Rental"("equipmentId");


-- CreateIndex
CREATE INDEX "Rental_renterId_idx" ON "Rental"("renterId");


-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");


-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "FraudDetection" ADD CONSTRAINT "FraudDetection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "PaymentAnalytics" ADD CONSTRAINT "PaymentAnalytics_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

