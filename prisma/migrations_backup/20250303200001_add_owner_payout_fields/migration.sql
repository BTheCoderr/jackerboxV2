-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "stripeId" TEXT,
    "stripePaymentIntentId" TEXT,
    "securityDepositAmount" REAL,
    "rentalAmount" REAL,
    "securityDepositReturned" BOOLEAN NOT NULL DEFAULT false,
    "ownerPaidOut" BOOLEAN NOT NULL DEFAULT false,
    "ownerPaidOutAmount" REAL,
    "platformFee" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "createdAt", "currency", "id", "paymentMethod", "rentalAmount", "rentalId", "securityDepositAmount", "securityDepositReturned", "status", "stripeId", "stripePaymentIntentId", "updatedAt", "userId") SELECT "amount", "createdAt", "currency", "id", "paymentMethod", "rentalAmount", "rentalId", "securityDepositAmount", "securityDepositReturned", "status", "stripeId", "stripePaymentIntentId", "updatedAt", "userId" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE UNIQUE INDEX "Payment_stripeId_key" ON "Payment"("stripeId");
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");
CREATE UNIQUE INDEX "Payment_rentalId_key" ON "Payment"("rentalId");
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
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "stripeConnectAccountId" TEXT
);
INSERT INTO "new_User" ("bio", "createdAt", "email", "emailVerified", "id", "image", "name", "password", "phone", "phoneVerified", "twoFactorEnabled", "updatedAt", "verificationToken") SELECT "bio", "createdAt", "email", "emailVerified", "id", "image", "name", "password", "phone", "phoneVerified", "twoFactorEnabled", "updatedAt", "verificationToken" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
