-- Create ENUMs
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'BLOCKED', 'RETRY_SCHEDULED');
CREATE TYPE "RentalStatus" AS ENUM ('PENDING', 'PAID', 'PAYMENT_FAILED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Create base tables without foreign key constraints
CREATE TABLE "User" (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    emailVerified TIMESTAMP,
    image TEXT,
    password TEXT,
    phone TEXT UNIQUE,
    phoneVerified BOOLEAN DEFAULT false,
    bio TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP,
    verificationToken TEXT,
    twoFactorEnabled BOOLEAN DEFAULT false,
    idVerified BOOLEAN DEFAULT false,
    idVerificationStatus TEXT,
    idDocumentType TEXT,
    idDocumentUrl TEXT,
    idVerificationDate TIMESTAMP,
    isAdmin BOOLEAN DEFAULT false,
    stripeConnectAccountId TEXT,
    userType TEXT DEFAULT 'both'
);

CREATE TABLE "Account" (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    providerAccountId TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    FOREIGN KEY (userId) REFERENCES "User"(id) ON DELETE CASCADE,
    UNIQUE(provider, providerAccountId)
);

CREATE TABLE "Session" (
    id TEXT PRIMARY KEY,
    sessionToken TEXT UNIQUE NOT NULL,
    userId TEXT NOT NULL,
    expires TIMESTAMP NOT NULL,
    FOREIGN KEY (userId) REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE TABLE "VerificationToken" (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires TIMESTAMP NOT NULL,
    UNIQUE(identifier, token)
);

CREATE TABLE "Equipment" (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    condition TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    tagsJson TEXT DEFAULT '[]',
    location TEXT NOT NULL,
    latitude FLOAT,
    longitude FLOAT,
    hourlyRate FLOAT,
    dailyRate FLOAT,
    weeklyRate FLOAT,
    securityDeposit FLOAT,
    imagesJson TEXT DEFAULT '[]',
    isVerified BOOLEAN DEFAULT false,
    isAvailable BOOLEAN DEFAULT true,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP,
    moderationStatus "ModerationStatus" DEFAULT 'PENDING',
    moderatedAt TIMESTAMP,
    moderatedBy TEXT,
    moderationNotes TEXT,
    ownerId TEXT NOT NULL,
    FOREIGN KEY (ownerId) REFERENCES "User"(id),
    FOREIGN KEY (moderatedBy) REFERENCES "User"(id)
);

CREATE TABLE "Availability" (
    id TEXT PRIMARY KEY,
    startDate TIMESTAMP NOT NULL,
    endDate TIMESTAMP NOT NULL,
    equipmentId TEXT NOT NULL,
    isRecurring BOOLEAN DEFAULT false,
    recurrenceDaysOfWeek TEXT,
    recurrenceEndDate TIMESTAMP,
    recurrenceInterval INTEGER,
    recurrenceType TEXT,
    FOREIGN KEY (equipmentId) REFERENCES "Equipment"(id) ON DELETE CASCADE
);

CREATE TABLE "Payment" (
    id TEXT PRIMARY KEY,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP,
    amount FLOAT NOT NULL,
    currency TEXT NOT NULL,
    status "PaymentStatus" NOT NULL,
    stripePaymentIntentId TEXT UNIQUE,
    stripeChargeId TEXT UNIQUE,
    paidAt TIMESTAMP,
    failedAt TIMESTAMP,
    refundedAt TIMESTAMP,
    metadata JSONB,
    retryCount INTEGER DEFAULT 0,
    lastRetryAt TIMESTAMP,
    nextRetryAt TIMESTAMP,
    ipAddress TEXT,
    userAgent TEXT,
    fraudScore FLOAT DEFAULT 0,
    velocityScore FLOAT DEFAULT 0,
    isBlocked BOOLEAN DEFAULT false,
    blockReason TEXT,
    rentalId TEXT UNIQUE,
    userId TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES "User"(id)
);

CREATE TABLE "Rental" (
    id TEXT PRIMARY KEY,
    startDate TIMESTAMP NOT NULL,
    endDate TIMESTAMP NOT NULL,
    status "RentalStatus" NOT NULL,
    totalAmount FLOAT NOT NULL,
    equipmentId TEXT NOT NULL,
    renterId TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP,
    FOREIGN KEY (equipmentId) REFERENCES "Equipment"(id),
    FOREIGN KEY (renterId) REFERENCES "User"(id)
);

-- Add foreign key for Payment->Rental after Rental table is created
ALTER TABLE "Payment" ADD FOREIGN KEY (rentalId) REFERENCES "Rental"(id);

CREATE TABLE "Review" (
    id TEXT PRIMARY KEY,
    rating INTEGER NOT NULL,
    comment TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP,
    authorId TEXT NOT NULL,
    receiverId TEXT NOT NULL,
    equipmentId TEXT,
    rentalId TEXT,
    FOREIGN KEY (authorId) REFERENCES "User"(id),
    FOREIGN KEY (receiverId) REFERENCES "User"(id),
    FOREIGN KEY (equipmentId) REFERENCES "Equipment"(id),
    FOREIGN KEY (rentalId) REFERENCES "Rental"(id)
);

CREATE TABLE "ReviewVote" (
    id TEXT PRIMARY KEY,
    value INTEGER NOT NULL,
    userId TEXT NOT NULL,
    reviewId TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES "User"(id),
    FOREIGN KEY (reviewId) REFERENCES "Review"(id)
);

CREATE TABLE "Message" (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    senderId TEXT NOT NULL,
    receiverId TEXT NOT NULL,
    readAt TIMESTAMP,
    FOREIGN KEY (senderId) REFERENCES "User"(id),
    FOREIGN KEY (receiverId) REFERENCES "User"(id)
);

CREATE TABLE "Notification" (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    userId TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES "User"(id)
);

CREATE TABLE "CalendarSync" (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    calendarId TEXT NOT NULL,
    accessToken TEXT,
    refreshToken TEXT,
    expiresAt TIMESTAMP,
    lastSyncedAt TIMESTAMP,
    userId TEXT NOT NULL,
    equipmentId TEXT UNIQUE,
    FOREIGN KEY (userId) REFERENCES "User"(id),
    FOREIGN KEY (equipmentId) REFERENCES "Equipment"(id)
);

CREATE TABLE "PushSubscription" (
    id TEXT PRIMARY KEY,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    userId TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES "User"(id)
);

CREATE TABLE "PaymentAnalytics" (
    id TEXT PRIMARY KEY,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    totalTransactions INTEGER DEFAULT 0,
    successCount INTEGER DEFAULT 0,
    failureCount INTEGER DEFAULT 0,
    totalAmount FLOAT DEFAULT 0,
    averageAmount FLOAT DEFAULT 0,
    peakHour INTEGER,
    equipmentId TEXT,
    FOREIGN KEY (equipmentId) REFERENCES "Equipment"(id),
    UNIQUE(date, equipmentId)
);

CREATE TABLE "FraudDetection" (
    id TEXT PRIMARY KEY,
    ipAddress TEXT NOT NULL,
    userAgent TEXT,
    score FLOAT DEFAULT 0,
    lastDetectedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    detectionCount INTEGER DEFAULT 1,
    userId TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES "User"(id)
);

-- Create indexes
CREATE INDEX "equipment_owner_idx" ON "Equipment"(ownerId);
CREATE INDEX "equipment_moderation_idx" ON "Equipment"(moderationStatus);
CREATE INDEX "equipment_moderator_idx" ON "Equipment"(moderatedBy);
CREATE INDEX "payment_status_idx" ON "Payment"(status);
CREATE INDEX "payment_created_idx" ON "Payment"(createdAt);
CREATE INDEX "payment_ip_idx" ON "Payment"(ipAddress);
CREATE INDEX "analytics_date_idx" ON "PaymentAnalytics"(date);
CREATE INDEX "analytics_equipment_idx" ON "PaymentAnalytics"(equipmentId); 