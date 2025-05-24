#!/usr/bin/env node

/**
 * Test specific carrier gateways manually
 */

require('dotenv').config({ path: '.env.local' });

async function testSpecificCarrier() {
  const { sendSmsViaEmail } = require('../src/lib/email-to-sms.ts');
  
  const phoneNumber = '+14012179799'; // Replace with your number
  const carriers = [
    { name: 'AT&T', gateway: 'txt.att.net' },
    { name: 'Verizon', gateway: 'vtext.com' },
    { name: 'T-Mobile', gateway: 'tmomail.net' },
    { name: 'Sprint', gateway: 'messaging.sprintpcs.com' },
    { name: 'Boost', gateway: 'sms.myboostmobile.com' },
    { name: 'Cricket', gateway: 'sms.cricketwireless.net' },
  ];
  
  console.log(`🧪 Testing each carrier individually for ${phoneNumber}...\n`);
  
  for (let i = 0; i < carriers.length; i++) {
    const carrier = carriers[i];
    const testCode = `${i + 1}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    console.log(`📱 ${i + 1}/${carriers.length} Testing ${carrier.name} (${carrier.gateway})...`);
    
    try {
      const result = await sendSmsViaEmail(
        phoneNumber, 
        `TEST ${carrier.name}: Code ${testCode}. This is carrier test #${i + 1}. Reply ${i + 1} if you get this!`,
        carrier.name.toLowerCase().replace(/[^a-z]/g, '')
      );
      
      if (result.success) {
        console.log(`   ✅ Sent via ${result.gateway}`);
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
    
    // Wait 2 seconds between tests to respect rate limits
    if (i < carriers.length - 1) {
      console.log('   ⏱️  Waiting 2 seconds...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('✅ All carrier tests complete!');
  console.log('📱 Check your phone for SMS messages from different carriers.');
  console.log('🔍 Note which carrier number (1-6) you receive, if any.');
  console.log('');
  console.log('If you receive multiple messages, your phone supports multiple gateways!');
  console.log('If you receive none, the issue might be:');
  console.log('  - Carrier blocking automated emails');
  console.log('  - Wrong phone number format');
  console.log('  - Your carrier uses a different gateway');
  console.log('  - SMS delivery delays (can take up to 5 minutes)');
}

testSpecificCarrier().catch(console.error); 