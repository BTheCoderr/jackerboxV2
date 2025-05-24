import { NextResponse } from "next/server";
import { z } from "zod";

// Schema for inbound SMS webhook (Twilio format)
const twilioWebhookSchema = z.object({
  From: z.string(),
  To: z.string(),
  Body: z.string(),
  MessageSid: z.string().optional(),
  AccountSid: z.string().optional(),
});

// Schema for inbound SMS webhook (Telnyx format)
const telnyxWebhookSchema = z.object({
  data: z.object({
    event_type: z.string(),
    payload: z.object({
      from: z.object({
        phone_number: z.string(),
      }),
      to: z.array(z.object({
        phone_number: z.string(),
      })),
      text: z.string(),
      id: z.string(),
    }),
  }),
});

/**
 * Handle inbound SMS webhooks
 * Supports Twilio and Telnyx formats
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('📥 Inbound SMS webhook received:', body);

    let fromNumber: string;
    let toNumber: string;
    let messageText: string;
    let messageId: string;
    let provider: string;

    // Try to parse as Twilio webhook
    try {
      const twilioData = twilioWebhookSchema.parse(body);
      fromNumber = twilioData.From;
      toNumber = twilioData.To;
      messageText = twilioData.Body;
      messageId = twilioData.MessageSid || 'unknown';
      provider = 'twilio';
    } catch {
      // Try to parse as Telnyx webhook
      try {
        const telnyxData = telnyxWebhookSchema.parse(body);
        if (telnyxData.data.event_type === 'message.received') {
          fromNumber = telnyxData.data.payload.from.phone_number;
          toNumber = telnyxData.data.payload.to[0]?.phone_number || '';
          messageText = telnyxData.data.payload.text;
          messageId = telnyxData.data.payload.id;
          provider = 'telnyx';
        } else {
          throw new Error('Not a message.received event');
        }
      } catch {
        console.error('❌ Unknown webhook format:', body);
        return NextResponse.json(
          { error: "Unsupported webhook format" },
          { status: 400 }
        );
      }
    }

    console.log(`📱 SMS from ${fromNumber} to ${toNumber} via ${provider}:`);
    console.log(`   Message: "${messageText}"`);
    console.log(`   ID: ${messageId}`);

    // Handle different types of inbound messages
    const response = await handleInboundSMS({
      from: fromNumber,
      to: toNumber,
      message: messageText,
      messageId,
      provider
    });

    // Return appropriate response based on provider
    if (provider === 'twilio') {
      // Twilio expects TwiML response
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${response}</Message></Response>`,
        {
          headers: { 'Content-Type': 'text/xml' },
          status: 200
        }
      );
    } else {
      // Telnyx and others expect JSON
      return NextResponse.json({ 
        success: true, 
        response 
      });
    }

  } catch (error) {
    console.error('❌ Inbound SMS webhook error:', error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle different types of inbound SMS messages
 */
async function handleInboundSMS({
  from,
  to,
  message,
  messageId,
  provider
}: {
  from: string;
  to: string;
  message: string;
  messageId: string;
  provider: string;
}): Promise<string> {
  
  const lowerMessage = message.toLowerCase().trim();

  // Handle verification code confirmations
  if (/^\d{6}$/.test(lowerMessage)) {
    // User sent a 6-digit code back
    console.log(`🔐 User ${from} sent verification code: ${lowerMessage}`);
    
    // TODO: Verify the code against your database
    // const isValid = await verifyUserCode(from, lowerMessage);
    
    return "Thanks! Your verification code has been received.";
  }

  // Handle help requests
  if (lowerMessage.includes('help') || lowerMessage === '?') {
    return "Jackerbox Help: Reply with your 6-digit verification code to complete login. Need support? Visit our website.";
  }

  // Handle stop/unsubscribe
  if (lowerMessage.includes('stop') || lowerMessage.includes('unsubscribe')) {
    console.log(`🛑 User ${from} requested to stop SMS`);
    
    // TODO: Add user to do-not-send list
    // await addToDoNotSendList(from);
    
    return "You have been unsubscribed from Jackerbox SMS. Text START to resubscribe.";
  }

  // Handle start/resubscribe
  if (lowerMessage.includes('start') || lowerMessage.includes('subscribe')) {
    console.log(`▶️ User ${from} requested to start SMS`);
    
    // TODO: Remove user from do-not-send list
    // await removeFromDoNotSendList(from);
    
    return "You have been resubscribed to Jackerbox SMS. Welcome back!";
  }

  // Handle general messages
  console.log(`💬 General message from ${from}: "${message}"`);
  
  // TODO: Forward to customer support system
  // await forwardToSupport(from, message);

  return "Thanks for your message! Our team will get back to you soon. For immediate help, reply HELP.";
}

/**
 * GET handler for webhook verification (some providers require this)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const challenge = url.searchParams.get('challenge');
  
  if (challenge) {
    // Webhook verification challenge
    return new Response(challenge, { status: 200 });
  }
  
  return NextResponse.json({ 
    message: "Inbound SMS webhook endpoint", 
    status: "active" 
  });
} 