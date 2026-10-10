import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unexpectedSchemaStatements } from '../../scripts/validate-legacy-schema-drift.mjs';

test('no drift is safe', () => {
  assert.deepEqual(unexpectedSchemaStatements(''), []);
});
test('retaining legacy disputes is an approved compatibility difference', () => {
  assert.deepEqual(unexpectedSchemaStatements('-- DropTable\nDROP TABLE "Dispute";'), []);
});
test('a newly missing model is always a release blocker', () => {
  assert.deepEqual(unexpectedSchemaStatements('CREATE TABLE "MissingBookings" ("id" TEXT);'), [
    'CREATE TABLE "MissingBookings" ("id" TEXT)',
  ]);
});
test('dropping another financial table is never permitted', () => {
  assert.deepEqual(unexpectedSchemaStatements('DROP TABLE "Payment";'), ['DROP TABLE "Payment"']);
});
test('unknown destructive column changes fail the retention allowlist', () => {
  assert.deepEqual(unexpectedSchemaStatements('ALTER TABLE "Payment" DROP COLUMN "amount";'), [
    'ALTER TABLE "Payment" DROP COLUMN "amount"',
  ]);
});
