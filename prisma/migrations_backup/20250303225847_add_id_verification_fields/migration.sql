-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "phone" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "verificationToken" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "idVerified" BOOLEAN NOT NULL DEFAULT false,
    "idVerificationStatus" TEXT,
    "idDocumentType" TEXT,
    "idDocumentUrl" TEXT,
    "idVerificationDate" DATETIME,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "stripeConnectAccountId" TEXT
);
INSERT INTO "new_User" ("bio", "createdAt", "email", "emailVerified", "id", "image", "isAdmin", "name", "password", "phone", "phoneVerified", "stripeConnectAccountId", "twoFactorEnabled", "updatedAt", "verificationToken") SELECT "bio", "createdAt", "email", "emailVerified", "id", "image", "isAdmin", "name", "password", "phone", "phoneVerified", "stripeConnectAccountId", "twoFactorEnabled", "updatedAt", "verificationToken" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
