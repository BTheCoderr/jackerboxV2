import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// This is a test endpoint only for development environments
export async function POST(req: Request) {
  // Ensure this endpoint is only accessible in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }
  
  // Check if user is authenticated and is an admin
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.user.isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { action, paymentIntentId } = await req.json();
    
    if (action === 'create') {
      // Create a test payment intent
      const user = await db.user.findUnique({
        where: { email: session.user.email! }
      });
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      const result = await PaymentService.createPaymentIntent(1000, 'usd', {
        userId: user.id,
        securityDeposit: '200',
        rentalAmount: '800',
      });
      
      return NextResponse.json({
        message: 'Payment intent created successfully',
        clientSecret: result.paymentIntent.client_secret,
        paymentIntentId: result.paymentIntent.id,
        payment: result.payment
      });
    }
    
    if (action === 'simulate-success' && paymentIntentId) {
      const result = await PaymentService.handlePaymentSuccess(paymentIntentId);
      return NextResponse.json({
        message: 'Payment success simulated',
        result
      });
    }
    
    if (action === 'simulate-failure' && paymentIntentId) {
      const result = await PaymentService.handlePaymentFailure(paymentIntentId);
      return NextResponse.json({
        message: 'Payment failure simulated',
        result
      });
    }
    
    if (action === 'refund' && paymentIntentId) {
      const result = await PaymentService.refundPayment(paymentIntentId);
      return NextResponse.json({
        message: 'Payment refunded',
        result
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in payments test endpoint:', error);
    return NextResponse.json(
      { error: 'An error occurred processing the payment test' },
      { status: 500 }
    );
  }
} 