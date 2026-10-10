import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ALLOWED = [
  'ALTER TABLE "Dispute" DROP CONSTRAINT "Dispute_createdById_fkey"',
  'ALTER TABLE "Dispute" DROP CONSTRAINT "Dispute_rentalId_fkey"',
  'ALTER TABLE "Dispute" DROP CONSTRAINT "Dispute_resolvedById_fkey"',
  'ALTER TABLE "Message" DROP CONSTRAINT "Message_receiverId_fkey"',
  'ALTER TABLE "Payment" DROP CONSTRAINT "Payment_rentalId_fkey"',
  'DROP INDEX "Payment_disputeId_key"',
  'DROP INDEX "Payment_stripeId_key"',
  'DROP INDEX "Payment_stripeTransferId_key"',
  'ALTER TABLE "Message" DROP COLUMN "attachmentsJson", DROP COLUMN "isRead", DROP COLUMN "receiverId"',
  'ALTER TABLE "Payment" DROP COLUMN "disputeId", DROP COLUMN "ownerPaidOut", DROP COLUMN "ownerPaidOutAmount", DROP COLUMN "paymentMethod", DROP COLUMN "platformFee", DROP COLUMN "rentalAmount", DROP COLUMN "securityDepositAmount", DROP COLUMN "securityDepositReturned", DROP COLUMN "stripeId", DROP COLUMN "stripeTransferId", ALTER COLUMN "currency" DROP DEFAULT',
  'DROP TABLE "Dispute"',
  'ALTER TABLE "Payment" ADD CONSTRAINT "Payment_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE SET NULL ON UPDATE CASCADE',
];

const canonical = value => value.replace(/\s+/g, ' ').trim();
const allowedSet = new Set(ALLOWED.map(canonical));

export function unexpectedSchemaStatements(sql) {
  const withoutComments = sql.replace(/^\s*--.*$/gm, '');
  return withoutComments.split(';').map(canonical).filter(Boolean)
    .filter(statement => !allowedSet.has(statement));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const drift = readFileSync(process.argv[2], 'utf8');
  const unexpected = unexpectedSchemaStatements(drift);
  if (unexpected.length) {
    console.error('Unexpected schema drift detected; migration review required:');
    for (const statement of unexpected) console.error(statement + ';');
    process.exitCode = 1;
  } else {
    console.log('Schema has only explicitly allowed historical-data retention differences.');
    console.log('The legacy Dispute table, older message fields, and payment audit fields are intentionally kept.');
  }
}
