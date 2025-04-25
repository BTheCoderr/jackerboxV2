import { db } from '@/lib/db';
import logger from '@/lib/logger';
import { PaymentStatus } from '@prisma/client';
import { sendEmail } from '@/lib/email';

export class PaymentMonitor {
  private static readonly ALERT_THRESHOLD = 3; // Number of failed payments before alerting
  private static readonly MONITORING_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  static async checkFailedPayments() {
    try {
      // Get failed payments in the last 24 hours
      const failedPayments = await db.payment.findMany({
        where: {
          status: PaymentStatus.FAILED,
          failedAt: {
            gte: new Date(Date.now() - this.MONITORING_WINDOW)
          }
        },
        include: {
          rental: {
            include: {
              user: true,
              equipment: true
            }
          }
        }
      });

      // Log failed payments count
      logger.info(`Found ${failedPayments.length} failed payments in the last 24 hours`);

      // Alert if threshold is exceeded
      if (failedPayments.length >= this.ALERT_THRESHOLD) {
        await this.sendFailedPaymentsAlert(failedPayments);
      }

      // Process each failed payment
      for (const payment of failedPayments) {
        await this.handleFailedPayment(payment);
      }

      return failedPayments;
    } catch (error) {
      logger.error('Error monitoring payments:', error);
      throw error;
    }
  }

  private static async handleFailedPayment(payment: any) {
    try {
      // Send notification to user
      if (payment.rental?.user?.email) {
        await sendEmail({
          to: payment.rental.user.email,
          subject: 'Payment Failed - Action Required',
          text: `Your payment of ${payment.amount} ${payment.currency} for rental ${payment.rental.id} has failed. Please update your payment method.`,
        });
      }

      // Log the failure details
      logger.error('Payment failed:', {
        paymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        rentalId: payment.rental?.id,
        userId: payment.rental?.user?.id,
        equipmentId: payment.rental?.equipment?.id,
        failedAt: payment.failedAt
      });

    } catch (error) {
      logger.error('Error handling failed payment:', error);
    }
  }

  private static async sendFailedPaymentsAlert(failedPayments: any[]) {
    try {
      // Send alert to admin
      await sendEmail({
        to: process.env.ADMIN_EMAIL || 'admin@jackerbox.com',
        subject: 'High Failed Payments Alert',
        text: `Alert: ${failedPayments.length} payments failed in the last 24 hours.\n\n` +
          failedPayments.map(p => 
            `Payment ID: ${p.id}\n` +
            `Amount: ${p.amount} ${p.currency}\n` +
            `Rental ID: ${p.rental?.id}\n` +
            `User: ${p.rental?.user?.email}\n` +
            `Failed At: ${p.failedAt}\n`
          ).join('\n')
      });

      logger.warn('Sent failed payments alert to admin');
    } catch (error) {
      logger.error('Error sending failed payments alert:', error);
    }
  }

  // Start monitoring
  static startMonitoring(intervalMinutes = 60) {
    setInterval(() => {
      this.checkFailedPayments().catch(error => {
        logger.error('Payment monitoring error:', error);
      });
    }, intervalMinutes * 60 * 1000);

    logger.info('Payment monitoring started');
  }
} 