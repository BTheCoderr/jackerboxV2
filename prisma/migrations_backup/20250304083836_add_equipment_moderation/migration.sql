-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "location" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "hourlyRate" REAL,
    "dailyRate" REAL,
    "weeklyRate" REAL,
    "securityDeposit" REAL,
    "imagesJson" TEXT NOT NULL DEFAULT '[]',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "moderationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "moderatedAt" DATETIME,
    "moderatedBy" TEXT,
    "moderationNotes" TEXT,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "Equipment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Equipment_moderatedBy_fkey" FOREIGN KEY ("moderatedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Equipment" ("category", "condition", "createdAt", "dailyRate", "description", "hourlyRate", "id", "imagesJson", "isAvailable", "isVerified", "latitude", "location", "longitude", "ownerId", "securityDeposit", "subcategory", "tagsJson", "title", "updatedAt", "weeklyRate") SELECT "category", "condition", "createdAt", "dailyRate", "description", "hourlyRate", "id", "imagesJson", "isAvailable", "isVerified", "latitude", "location", "longitude", "ownerId", "securityDeposit", "subcategory", "tagsJson", "title", "updatedAt", "weeklyRate" FROM "Equipment";
DROP TABLE "Equipment";
ALTER TABLE "new_Equipment" RENAME TO "Equipment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
