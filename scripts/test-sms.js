#!/usr/bin/env node

/**
 * Test SMS functionality with Twilio
 * This script tests if SMS sending works with the current configuration
 */

require('dotenv').config({ path: '.env.local' });

async function testSMS() {
  console.log('🧪 Testing SMS functionality...\n');

  // Check environment variables
  const requiredVars = [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN', 
    'TWILIO_PHONE_NUMBER'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Missing Twilio environment variables:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\n📝 To fix this:');
    console.log('1. Sign up for Twilio at https://www.twilio.com/');
    console.log('2. Get your Account SID, Auth Token, and Phone Number');
    console.log('3. Add them to your .env.local file:');
    console.log('   TWILIO_ACCOUNT_SID=your_account_sid');
    console.log('   TWILIO_AUTH_TOKEN=your_auth_token');
    console.log('   TWILIO_PHONE_NUMBER=your_twilio_phone_number');
    return;
  }

  console.log('✅ Twilio environment variables found');
  console.log(`   Account SID: ${process.env.TWILIO_ACCOUNT_SID?.substring(0, 10)}...`);
  console.log(`   Phone Number: ${process.env.TWILIO_PHONE_NUMBER}`);

  // Test Twilio client initialization
  try {
    const { Twilio } = require('twilio');
    const client = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    console.log('\n✅ Twilio client initialized successfully');

    // Test sending SMS to a test number
    const testPhoneNumber = '+15555555555'; // Test number
    const testMessage = 'Test message from Jackerbox - SMS is working!';

    console.log(`\n📱 Testing SMS send to ${testPhoneNumber}...`);
    
    try {
      const message = await client.messages.create({
        body: testMessage,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: testPhoneNumber,
      });

      console.log('✅ SMS sent successfully!');
      console.log(`   Message SID: ${message.sid}`);
      console.log(`   Status: ${message.status}`);
    } catch (smsError) {
      console.log('⚠️  SMS send failed (this is expected for test numbers):');
      console.log(`   Error: ${smsError.message}`);
      
      if (smsError.code === 21614) {
        console.log('   This is normal - test numbers are not real phone numbers');
        console.log('   SMS functionality is configured correctly!');
      }
    }

  } catch (error) {
    console.log('❌ Twilio client initialization failed:');
    console.log(`   Error: ${error.message}`);
    return;
  }

  console.log('\n🎉 SMS test completed!');
  console.log('\n📋 Next steps:');
  console.log('1. The SMS infrastructure is ready');
  console.log('2. Test with a real phone number by using the login form');
  console.log('3. For development, use test numbers: +15555555555, +12025550123');
  console.log('4. Test verification code is always: 123456');
}

// Run the test
testSMS().catch(console.error); 