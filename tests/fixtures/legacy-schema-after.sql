-- All validations fail the job rather than silently dropping legacy data.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Payment"
                 WHERE "id" = 'legacy-payment' AND "status"::text = 'COMPLETED'
                   AND "platformFee" = 15 AND "ownerPaidOut" = true
                   AND "metadata"->>'ownerPayoutTransferId' = 'tr_legacy_transfer'
                   AND "metadata"->>'legacyOwnerPayoutRecorded' = 'true'
                   AND "metadata"->>'legacySecurityDepositRefundRecorded' = 'true') THEN
    RAISE EXCEPTION 'Historical payment data lost or altered';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Rental"
                 WHERE "id" = 'legacy-rental' AND "status"::text = 'COMPLETED') THEN
    RAISE EXCEPTION 'Historical rental status lost or altered';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Message"
                 WHERE "id" = 'legacy-message' AND "recipientId" = 'legacy-owner'
                   AND "receiverId" = 'legacy-owner' AND "equipmentId" IS NULL) THEN
    RAISE EXCEPTION 'Historical message recipient or content lost';
  END IF;
  IF to_regclass('"Dispute"') IS NULL THEN
    RAISE EXCEPTION 'Historical disputes table was dropped';
  END IF;
  IF to_regclass('"Booking"') IS NULL OR to_regclass('"PushSubscription"') IS NULL
     OR to_regclass('"FraudDetection"') IS NULL OR to_regclass('"PaymentAnalytics"') IS NULL THEN
    RAISE EXCEPTION 'Current application support tables missing';
  END IF;
END $$;
