-- CreateIndex
CREATE INDEX "Equipment_ownerId_idx" ON "Equipment"("ownerId");

-- CreateIndex
CREATE INDEX "Equipment_moderationStatus_idx" ON "Equipment"("moderationStatus");

-- CreateIndex
CREATE INDEX "Equipment_moderatedBy_idx" ON "Equipment"("moderatedBy");
