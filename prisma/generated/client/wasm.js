
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  emailVerified: 'emailVerified',
  image: 'image',
  password: 'password',
  phone: 'phone',
  phoneVerified: 'phoneVerified',
  bio: 'bio',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  verificationToken: 'verificationToken',
  twoFactorEnabled: 'twoFactorEnabled',
  idVerified: 'idVerified',
  idVerificationStatus: 'idVerificationStatus',
  idDocumentType: 'idDocumentType',
  idDocumentUrl: 'idDocumentUrl',
  idVerificationDate: 'idVerificationDate',
  isAdmin: 'isAdmin',
  stripeConnectAccountId: 'stripeConnectAccountId',
  userType: 'userType'
};

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  provider: 'provider',
  providerAccountId: 'providerAccountId',
  refresh_token: 'refresh_token',
  access_token: 'access_token',
  expires_at: 'expires_at',
  token_type: 'token_type',
  scope: 'scope',
  id_token: 'id_token',
  session_state: 'session_state'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  sessionToken: 'sessionToken',
  userId: 'userId',
  expires: 'expires'
};

exports.Prisma.VerificationTokenScalarFieldEnum = {
  identifier: 'identifier',
  token: 'token',
  expires: 'expires'
};

exports.Prisma.EquipmentScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  condition: 'condition',
  category: 'category',
  subcategory: 'subcategory',
  tagsJson: 'tagsJson',
  location: 'location',
  latitude: 'latitude',
  longitude: 'longitude',
  hourlyRate: 'hourlyRate',
  dailyRate: 'dailyRate',
  weeklyRate: 'weeklyRate',
  securityDeposit: 'securityDeposit',
  imagesJson: 'imagesJson',
  isVerified: 'isVerified',
  isAvailable: 'isAvailable',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  moderationStatus: 'moderationStatus',
  moderatedAt: 'moderatedAt',
  moderatedBy: 'moderatedBy',
  moderationNotes: 'moderationNotes',
  ownerId: 'ownerId'
};

exports.Prisma.AvailabilityScalarFieldEnum = {
  id: 'id',
  startDate: 'startDate',
  endDate: 'endDate',
  equipmentId: 'equipmentId',
  isRecurring: 'isRecurring',
  recurrenceDaysOfWeek: 'recurrenceDaysOfWeek',
  recurrenceEndDate: 'recurrenceEndDate',
  recurrenceInterval: 'recurrenceInterval',
  recurrenceType: 'recurrenceType'
};

exports.Prisma.RentalScalarFieldEnum = {
  id: 'id',
  startDate: 'startDate',
  endDate: 'endDate',
  totalPrice: 'totalPrice',
  securityDeposit: 'securityDeposit',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  equipmentId: 'equipmentId',
  renterId: 'renterId',
  status: 'status'
};

exports.Prisma.ReviewScalarFieldEnum = {
  id: 'id',
  rating: 'rating',
  comment: 'comment',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  authorId: 'authorId',
  receiverId: 'receiverId',
  equipmentId: 'equipmentId',
  rentalId: 'rentalId',
  helpfulVotes: 'helpfulVotes',
  isVerifiedRental: 'isVerifiedRental',
  ownerResponse: 'ownerResponse',
  ownerResponseDate: 'ownerResponseDate',
  reportCount: 'reportCount',
  unhelpfulVotes: 'unhelpfulVotes'
};

exports.Prisma.ReviewVoteScalarFieldEnum = {
  id: 'id',
  reviewId: 'reviewId',
  userId: 'userId',
  isHelpful: 'isHelpful',
  createdAt: 'createdAt'
};

exports.Prisma.PaymentScalarFieldEnum = {
  id: 'id',
  amount: 'amount',
  currency: 'currency',
  stripePaymentIntentId: 'stripePaymentIntentId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  userId: 'userId',
  rentalId: 'rentalId',
  blockReason: 'blockReason',
  failedAt: 'failedAt',
  fraudScore: 'fraudScore',
  ipAddress: 'ipAddress',
  isBlocked: 'isBlocked',
  lastRetryAt: 'lastRetryAt',
  metadata: 'metadata',
  nextRetryAt: 'nextRetryAt',
  paidAt: 'paidAt',
  refundedAt: 'refundedAt',
  retryCount: 'retryCount',
  stripeChargeId: 'stripeChargeId',
  userAgent: 'userAgent',
  velocityScore: 'velocityScore',
  status: 'status'
};

exports.Prisma.MessageScalarFieldEnum = {
  id: 'id',
  content: 'content',
  isRead: 'isRead',
  createdAt: 'createdAt',
  senderId: 'senderId',
  receiverId: 'receiverId',
  attachmentsJson: 'attachmentsJson'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  type: 'type',
  userId: 'userId',
  data: 'data',
  read: 'read',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CalendarSyncScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  equipmentId: 'equipmentId',
  calendarType: 'calendarType',
  calendarId: 'calendarId',
  icalUrl: 'icalUrl',
  syncDirection: 'syncDirection',
  syncFrequency: 'syncFrequency',
  lastSynced: 'lastSynced',
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  tokenExpiry: 'tokenExpiry',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PushSubscriptionScalarFieldEnum = {
  id: 'id',
  endpoint: 'endpoint',
  auth: 'auth',
  p256dh: 'p256dh',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FraudDetectionScalarFieldEnum = {
  id: 'id',
  ipAddress: 'ipAddress',
  lastAttemptAt: 'lastAttemptAt',
  attemptCount: 'attemptCount',
  isBlocked: 'isBlocked',
  blockExpiresAt: 'blockExpiresAt',
  failureCount: 'failureCount',
  successCount: 'successCount',
  riskScore: 'riskScore',
  userId: 'userId'
};

exports.Prisma.PaymentAnalyticsScalarFieldEnum = {
  id: 'id',
  date: 'date',
  totalTransactions: 'totalTransactions',
  successCount: 'successCount',
  failureCount: 'failureCount',
  totalAmount: 'totalAmount',
  averageAmount: 'averageAmount',
  peakHour: 'peakHour',
  equipmentId: 'equipmentId'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.ModerationStatus = exports.$Enums.ModerationStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  FLAGGED: 'FLAGGED'
};

exports.RentalStatus = exports.$Enums.RentalStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED'
};

exports.PaymentStatus = exports.$Enums.PaymentStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  BLOCKED: 'BLOCKED',
  RETRY_SCHEDULED: 'RETRY_SCHEDULED'
};

exports.Prisma.ModelName = {
  User: 'User',
  Account: 'Account',
  Session: 'Session',
  VerificationToken: 'VerificationToken',
  Equipment: 'Equipment',
  Availability: 'Availability',
  Rental: 'Rental',
  Review: 'Review',
  ReviewVote: 'ReviewVote',
  Payment: 'Payment',
  Message: 'Message',
  Notification: 'Notification',
  CalendarSync: 'CalendarSync',
  PushSubscription: 'PushSubscription',
  FraudDetection: 'FraudDetection',
  PaymentAnalytics: 'PaymentAnalytics'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
