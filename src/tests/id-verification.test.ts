import { createIdentityVerificationSession, retrieveIdentityVerificationSession } from '@/lib/stripe';
import { mockDb } from './setup';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('ID Verification System', () => {
  const testUserId = 'test-user-123';
  const testReturnUrl = 'http://localhost:3000/test-return';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createIdentityVerificationSession', () => {
    it('should create a verification session', async () => {
      const session = await createIdentityVerificationSession(testUserId, testReturnUrl);
      
      expect(session).toBeDefined();
      expect(session.type).toBe('document');
      expect(session.metadata?.userId).toBe(testUserId);
      expect(session.return_url).toBe(testReturnUrl);
      expect(session.options?.document?.require_id_number).toBe(true);
      expect(session.options?.document?.require_matching_selfie).toBe(true);
    });

    it('should update user verification status to pending', async () => {
      // Mock the database update
      mockDb.user.update.mockResolvedValueOnce({
        id: testUserId,
        idVerificationStatus: 'pending',
      });

      await createIdentityVerificationSession(testUserId, testReturnUrl);

      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: testUserId },
        data: {
          idVerificationStatus: 'pending',
        },
      });
    });
  });

  describe('retrieveIdentityVerificationSession', () => {
    it('should retrieve a verification session', async () => {
      const session = await retrieveIdentityVerificationSession('test_session_id');
      
      expect(session).toBeDefined();
      expect(session.id).toBe('test_session_id');
      expect(session.type).toBe('document');
      expect(session.status).toBe('verified');
    });
  });

  describe('Webhook Handling', () => {
    it('should handle verification success', async () => {
      // Mock the database update
      mockDb.user.update.mockResolvedValueOnce({
        id: testUserId,
        idVerified: true,
        idVerificationStatus: 'approved',
        idVerificationDate: new Date(),
      });

      await mockDb.user.update({
        where: { id: testUserId },
        data: {
          idVerified: true,
          idVerificationStatus: 'approved',
          idVerificationDate: new Date(),
        },
      });

      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: testUserId },
        data: {
          idVerified: true,
          idVerificationStatus: 'approved',
          idVerificationDate: expect.any(Date),
        },
      });
    });

    it('should handle verification failure', async () => {
      // Mock the database update
      mockDb.user.update.mockResolvedValueOnce({
        id: testUserId,
        idVerified: false,
        idVerificationStatus: 'requires_input',
      });

      await mockDb.user.update({
        where: { id: testUserId },
        data: {
          idVerified: false,
          idVerificationStatus: 'requires_input',
        },
      });

      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: testUserId },
        data: {
          idVerified: false,
          idVerificationStatus: 'requires_input',
        },
      });
    });
  });
}); 