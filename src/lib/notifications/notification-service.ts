import { sendEmail } from './email-service';
import { db } from '@/lib/db';

export enum NotificationType {
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  RENTAL_BOOKED = 'RENTAL_BOOKED',
  RENTAL_CANCELLED = 'RENTAL_CANCELLED',
  PAYOUT_PROCESSED = 'PAYOUT_PROCESSED',
  SECURITY_DEPOSIT_RETURNED = 'SECURITY_DEPOSIT_RETURNED',
  NEW_RENTAL = 'NEW_RENTAL',
  PAYMENT_DISPUTED = 'PAYMENT_DISPUTED',
}

interface NotificationOptions {
  userId: string;
  type: NotificationType;
  data?: Record<string, any>;
}

export async function sendNotification({ userId, type, data = {} }: NotificationOptions): Promise<boolean> {
  try {
    // Get the user
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.email) {
      console.error('User not found or has no email');
      return false;
    }

    // Generate email content based on notification type
    const { subject, text } = generateEmailContent(type, data, user.name || '');

    // Send the email
    await sendEmail({
      to: user.email,
      subject,
      text,
    });

    // Store notification in database (optional)
    await db.notification.create({
      data: {
        type,
        userId,
        data: data as any,
      },
    });

    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

function generateEmailContent(
  type: NotificationType, 
  data: Record<string, any>,
  userName: string
): { subject: string; text: string } {
  switch (type) {
    case NotificationType.PAYMENT_RECEIVED:
      return {
        subject: 'Payment Received - Jackerbox',
        text: `Hello ${userName},\n\nWe've received your payment of $${data.amount} for your rental. Thank you for your business!\n\nRental details:\nProperty: ${data.propertyName}\nCheck-in: ${data.checkIn}\nCheck-out: ${data.checkOut}\n\nBest regards,\nThe Jackerbox Team`,
      };
    
    case NotificationType.PAYMENT_FAILED:
      return {
        subject: 'Payment Failed - Jackerbox',
        text: `Hello ${userName},\n\nWe were unable to process your payment of $${data.amount} for your rental. Please update your payment information and try again.\n\nRental details:\nProperty: ${data.propertyName}\nCheck-in: ${data.checkIn}\nCheck-out: ${data.checkOut}\n\nBest regards,\nThe Jackerbox Team`,
      };
    
    case NotificationType.RENTAL_BOOKED:
      return {
        subject: 'Rental Booking Confirmed - Jackerbox',
        text: `Hello ${userName},\n\nYour rental booking has been confirmed!\n\nRental details:\nProperty: ${data.propertyName}\nCheck-in: ${data.checkIn}\nCheck-out: ${data.checkOut}\nTotal: $${data.amount}\n\nBest regards,\nThe Jackerbox Team`,
      };
    
    case NotificationType.RENTAL_CANCELLED:
      return {
        subject: 'Rental Booking Cancelled - Jackerbox',
        text: `Hello ${userName},\n\nYour rental booking has been cancelled.\n\nRental details:\nProperty: ${data.propertyName}\nCheck-in: ${data.checkIn}\nCheck-out: ${data.checkOut}\n\nBest regards,\nThe Jackerbox Team`,
      };
    
    case NotificationType.PAYOUT_PROCESSED:
      return {
        subject: 'Payout Processed - Jackerbox',
        text: `Hello ${userName},\n\nWe've processed a payout of $${data.amount} to your account. The funds should be available within 1-3 business days.\n\nRental details:\nProperty: ${data.propertyName}\nCheck-in: ${data.checkIn}\nCheck-out: ${data.checkOut}\n\nBest regards,\nThe Jackerbox Team`,
      };
    
    case NotificationType.SECURITY_DEPOSIT_RETURNED:
      return {
        subject: 'Security Deposit Returned - Jackerbox',
        text: `Hello ${userName},\n\nYour security deposit of $${data.amount} has been returned to your account. The funds should be available within 1-3 business days.\n\nRental details:\nProperty: ${data.propertyName}\nCheck-in: ${data.checkIn}\nCheck-out: ${data.checkOut}\n\nBest regards,\nThe Jackerbox Team`,
      };
    
    case NotificationType.NEW_RENTAL:
      return {
        subject: 'New Rental Booking - Jackerbox',
        text: `Hello ${userName},\n\nYou have a new rental booking for your equipment!\n\nRental details:\nEquipment: ${data.equipmentName}\nStart Date: ${new Date(data.startDate).toLocaleDateString()}\nEnd Date: ${new Date(data.endDate).toLocaleDateString()}\n\nYou can view the details in your dashboard.\n\nBest regards,\nThe Jackerbox Team`,
      };
    
    case NotificationType.PAYMENT_DISPUTED:
      return {
        subject: 'Payment Dispute - Jackerbox',
        text: `Hello ${userName},\n\nA payment dispute has been filed for a rental.\n\nDispute details:\nRental ID: ${data.rentalId}\nPayment ID: ${data.paymentId}\nAmount: $${data.amount}\nReason: ${data.reason}\nEquipment: ${data.equipmentName}\nRenter: ${data.renterName}\n\nOur team will review this dispute and contact you with more information.\n\nBest regards,\nThe Jackerbox Team`,
      };
    
    default:
      return {
        subject: 'Notification from Jackerbox',
        text: `Hello ${userName},\n\nThis is a notification from Jackerbox.\n\nBest regards,\nThe Jackerbox Team`,
      };
  }
} 