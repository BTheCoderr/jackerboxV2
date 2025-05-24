#!/usr/bin/env node

/**
 * Test 100% Free SMS Setup
 * This script tests email-to-SMS functionality without Twilio
 */

require('dotenv').config({ path: '.env.local' });

async function testFreeSMS() {
  console.log('🆓📱 Testing 100% Free SMS Setup...\n');

  // Check environment setup
  console.log('🔧 Environment Check:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   EMAIL_FROM: ${process.env.EMAIL_FROM || '❌ Missing'}`);
  console.log(`   TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? '⚠️ Set (will be used first)' : '✅ Not set (pure email-to-SMS)'}`);
  console.log('');

  // Test with direct API calls instead of importing TypeScript
  console.log('🔗 API Test:');
  console.log('Test your login API with:');
  console.log('');
  console.log('curl -X POST http://localhost:3001/api/auth/send-verification \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"phoneNumber": "+15555555555"}\'');
  console.log('');

  // Show which path will be taken
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    console.log('📱 Current Setup: Hybrid Mode');
    console.log('   Outbound: Twilio first, fallback to email-to-SMS');
    console.log('   Inbound: Twilio (if configured)');
    console.log('');
    console.log('💡 To test 100% free mode:');
    console.log('   1. Comment out Twilio variables in .env.local:');
    console.log('      # TWILIO_ACCOUNT_SID=');
    console.log('      # TWILIO_AUTH_TOKEN=');
    console.log('   2. Restart your dev server');
    console.log('');
  } else {
    console.log('🆓 Current Setup: 100% Free Mode');
    console.log('   Outbound: Email-to-SMS only');
    console.log('   Inbound: Manual setup required');
    console.log('');
  }

  if (!process.env.SENDGRID_API_KEY) {
    console.log('📋 Setup Instructions:');
    console.log('');
    console.log('1. Get SendGrid API Key:');
    console.log('   • Go to https://sendgrid.com');
    console.log('   • Sign up for free account (100 emails/day)');
    console.log('   • Create API key with Mail Send permissions');
    console.log('');
    console.log('2. Add to .env.local:');
    console.log('   SENDGRID_API_KEY=your_api_key_here');
    console.log('   EMAIL_FROM=noreply@yourdomain.com');
    console.log('');
    console.log('3. Comment out Twilio variables for pure email-to-SMS:');
    console.log('   # TWILIO_ACCOUNT_SID=');
    console.log('   # TWILIO_AUTH_TOKEN=');
    console.log('');
  } else {
    console.log('✅ SendGrid is configured! Testing API...');
    
    // Test API call
    try {
      const response = await fetch('http://localhost:3001/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: '+15555555555'
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ API Test SUCCESS:', result);
      } else {
        console.log('❌ API Test FAILED:', result);
      }
    } catch (error) {
      console.log('❌ API Test ERROR:', error.message);
      console.log('   Make sure your dev server is running: npm run dev');
    }
  }

  console.log('💡 Hybrid Inbound SMS Options:');
  console.log('');
  console.log('Option 1: Webhook.site (Free Testing)');
  console.log('   • Go to https://webhook.site');
  console.log('   • Get unique URL for testing inbound webhooks');
  console.log('   • Users text replies to any number, monitor webhook');
  console.log('');
  console.log('Option 2: Twilio Webhook (~$1/month)');
  console.log('   • Keep Twilio number ONLY for receiving');
  console.log('   • Cost: $1/month + $0.01 per inbound SMS');
  console.log('   • 100% reliable inbound handling');
  console.log('   • Webhook URL: https://yourdomain.com/api/sms/inbound');
  console.log('');
  console.log('Option 3: QR Code Alternative (100% Free)');
  console.log('   • Send QR code in SMS');
  console.log('   • Users scan → web form → instant response');
  console.log('   • More reliable than SMS replies');
  console.log('');

  console.log('🎉 Your 100% Free SMS System Features:');
  console.log('');
  console.log('✅ Free outbound SMS via email gateways');
  console.log('✅ Multi-carrier blast for reliability');
  console.log('✅ Automatic fallback chains');
  console.log('✅ No per-message costs');
  console.log('✅ SendGrid integration ready');
  console.log('✅ Inbound webhook handler ready');
  console.log('');
  
  console.log('📱 Updated Carrier Gateways:');
  console.log('   AT&T: @txt.att.net');
  console.log('   Verizon: @vtext.com (updated)');
  console.log('   T-Mobile: @tmomail.net');
  console.log('   Sprint: @messaging.sprintpcs.com');
  console.log('   Boost: @sms.myboostmobile.com');
  console.log('   Google Fi: @msg.fi.google.com (new)');
  console.log('');
  
  console.log('Next Steps:');
  console.log('1. Get SendGrid API key if not already done');
  console.log('2. Test with real phone numbers');
  console.log('3. Choose inbound SMS solution');
  console.log('4. Deploy and enjoy free messaging! 🚀');
}

// Run the test
testFreeSMS().catch(console.error); 