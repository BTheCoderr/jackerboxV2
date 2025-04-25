import { handleStripeEvent, verifyStripeSignature, respondToWebhook } from '@/lib/webhooks/stripe-webhook-handler';
import logger from '@/lib/logger';

export async function POST(req: Request) {
  // Get the webhook secret from environment variables
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    logger.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
    return new Response('Webhook secret is not configured', { status: 500 });
  }
  
  try {
    // Verify the Stripe signature
    const { event } = await verifyStripeSignature(req, webhookSecret);
    
    // Process the event
    const result = await handleStripeEvent(event);
    
    // Return the response
    return respondToWebhook(result);
  } catch (error: any) {
    return respondToWebhook(null, error);
  }
}; 