-- Throwaway Postgres fixture: recreate records shaped like the 2025 deployed schema.
INSERT INTO "User" ("id", "email", "updatedAt") VALUES
  ('legacy-owner', 'legacy-owner@example.test', NOW()),
  ('legacy-renter', 'legacy-renter@example.test', NOW());
INSERT INTO "Equipment" ("id", "title", "description", "condition", "category", "location", "ownerId", "updatedAt")
VALUES ('legacy-equipment', 'Legacy equipment', 'Historical listing', 'good', 'Tools', 'Providence, RI', 'legacy-owner', NOW());
INSERT INTO "Rental" ("id", "startDate", "endDate", "totalPrice", "status", "equipmentId", "renterId", "updatedAt")
VALUES ('legacy-rental', NOW(), NOW() + INTERVAL '1 day', 100, 'COMPLETED', 'legacy-equipment', 'legacy-renter', NOW());
INSERT INTO "Payment" ("id", "amount", "status", "userId", "rentalId", "updatedAt", "platformFee", "ownerPaidOut")
VALUES ('legacy-payment', 100, 'COMPLETED', 'legacy-renter', 'legacy-rental', NOW(), 15, false);
INSERT INTO "Message" ("id", "content", "senderId", "receiverId")
VALUES ('legacy-message', 'Please keep this historical message', 'legacy-renter', 'legacy-owner');
