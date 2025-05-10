import { db } from '@/lib/db';
import logger from '@/lib/logger';

export class FraudDetectionService {
  private static readonly MAX_ATTEMPTS_PER_HOUR = 5;
  private static readonly BLOCK_DURATION_HOURS = 24;
  private static readonly RISK_THRESHOLD = 0.7;

  static async checkFraud(ipAddress: string, userId?: string) {
    try {
      // Get or create fraud detection record
      const record = await db.fraudDetection.upsert({
        where: { ipAddress },
        create: {
          ipAddress,
          userId,
          lastAttemptAt: new Date(),
          attemptCount: 1
        },
        update: {
          lastAttemptAt: new Date(),
          attemptCount: {
            increment: 1
          },
          userId: userId || undefined
        }
      });

      // Check velocity
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (record.lastAttemptAt > hourAgo && record.attemptCount > this.MAX_ATTEMPTS_PER_HOUR) {
        await this.blockIP(ipAddress, 'Too many attempts');
        return {
          isBlocked: true,
          reason: 'Too many attempts',
          riskScore: 1
        };
      }

      // Calculate risk score
      const riskScore = await this.calculateRiskScore(record);
      if (riskScore >= this.RISK_THRESHOLD) {
        await this.blockIP(ipAddress, 'High risk score');
        return {
          isBlocked: true,
          reason: 'High risk score',
          riskScore
        };
      }

      return {
        isBlocked: false,
        riskScore
      };
    } catch (error) {
      logger.error('Error checking fraud:', error);
      throw error;
    }
  }

  private static async blockIP(ipAddress: string, reason: string) {
    try {
      await db.fraudDetection.update({
        where: { ipAddress },
        data: {
          isBlocked: true,
          blockExpiresAt: new Date(Date.now() + this.BLOCK_DURATION_HOURS * 60 * 60 * 1000)
        }
      });

      logger.warn('Blocked IP address:', { ipAddress, reason });
    } catch (error) {
      logger.error('Error blocking IP:', error);
      throw error;
    }
  }

  private static async calculateRiskScore(record: any) {
    const score = 
      // High attempt count
      (record.attemptCount > this.MAX_ATTEMPTS_PER_HOUR * 0.8 ? 0.4 : 0) +
      // Failed to success ratio
      (record.failureCount > record.successCount * 2 ? 0.3 : 0) +
      // Recent failures
      (record.lastAttemptAt > new Date(Date.now() - 15 * 60 * 1000) && record.failureCount > 0 ? 0.2 : 0) +
      // Multiple users from same IP
      (await this.checkMultipleUsers(record.ipAddress) ? 0.1 : 0);

    await db.fraudDetection.update({
      where: { ipAddress: record.ipAddress },
      data: { riskScore: score }
    });

    return score;
  }

  private static async checkMultipleUsers(ipAddress: string) {
    const userCount = await db.fraudDetection.count({
      where: {
        ipAddress,
        userId: { not: null },
      },
      distinct: ['userId']
    });
    return userCount > 1;
  }

  static async recordPaymentResult(ipAddress: string, success: boolean) {
    try {
      await db.fraudDetection.update({
        where: { ipAddress },
        data: success ? {
          successCount: { increment: 1 }
        } : {
          failureCount: { increment: 1 }
        }
      });
    } catch (error) {
      logger.error('Error recording payment result:', error);
      throw error;
    }
  }

  static async getSuspiciousActivities(hours = 24) {
    try {
      return await db.fraudDetection.findMany({
        where: {
          OR: [
            { isBlocked: true },
            { riskScore: { gte: this.RISK_THRESHOLD } },
            { failureCount: { gte: 3 } }
          ],
          lastAttemptAt: {
            gte: new Date(Date.now() - hours * 60 * 60 * 1000)
          }
        },
        include: {
          user: true
        },
        orderBy: {
          riskScore: 'desc'
        }
      });
    } catch (error) {
      logger.error('Error getting suspicious activities:', error);
      throw error;
    }
  }
} 