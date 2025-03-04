/*
  Warnings:

  - A unique constraint covering the columns `[disputeId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "disputeId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_disputeId_key" ON "Payment"("disputeId");
