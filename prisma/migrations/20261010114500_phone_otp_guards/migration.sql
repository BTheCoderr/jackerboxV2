ALTER TABLE "User"
  ADD COLUMN "phoneVerificationExpiresAt" TIMESTAMP(3),
  ADD COLUMN "phoneVerificationSentAt" TIMESTAMP(3),
  ADD COLUMN "phoneVerificationAttempts" INTEGER NOT NULL DEFAULT 0;
