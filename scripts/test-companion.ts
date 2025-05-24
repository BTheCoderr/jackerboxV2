#!/usr/bin/env npx tsx

import 'dotenv/config';

class TestingCompanion {
  private baseUrl = 'http://localhost:3001';
  
  printTestingMenu() {
    console.log('\n🎯 JACKERBOX TESTING COMPANION');
    console.log('================================');
    console.log('\n📋 Quick Test URLs:');
    console.log(`🏠 Home Page:           ${this.baseUrl}`);
    console.log(`🛍️  Equipment Browse:    ${this.baseUrl}/routes/equipment`);
    console.log(`🔐 Login:               ${this.baseUrl}/auth/login`);
    console.log(`📝 Register:            ${this.baseUrl}/auth/register`);
    console.log(`💳 Stripe Testing:      ${this.baseUrl}/test-stripe`);
    
    console.log('\n🧪 Test Data:');
    console.log('✅ Success Card:        4242 4242 4242 4242');
    console.log('❌ Declined Card:       4000 0000 0000 0002');
    console.log('💸 Insufficient Funds:  4000 0000 0000 9995');
    console.log('📧 Test Email:          test+jackerbox@example.com');
    console.log('🔑 Test Password:       TestPassword123!');
    
    console.log('\n📱 Testing Checklist:');
    console.log('□ Journey 1: Registration & First Booking');
    console.log('□ Journey 2: Equipment Listing Creation');
    console.log('□ Journey 3: Booking & Payment Flow');
    console.log('□ Journey 4: Mobile Experience');
    console.log('□ Journey 5: Return User Experience');
    console.log('□ Journey 6: Edge Cases & Error Handling');
    
    console.log('\n🎯 TESTING GOAL: 80%+ success rate = Ready for production!');
    console.log('\n📖 Full checklist: USER-JOURNEY-TESTING-CHECKLIST.md');
  }

  async checkServerStatus() {
    try {
      console.log('\n🔍 Checking server status...');
      const response = await fetch(this.baseUrl);
      if (response.ok) {
        console.log('✅ Server is running and responding!');
        return true;
      } else {
        console.log(`❌ Server responded with status: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log('❌ Server is not running. Start with: npm run dev');
      return false;
    }
  }

  async quickHealthCheck() {
    console.log('\n🏥 Quick Health Check...');
    const tests = [
      { name: 'Home Page', url: '/' },
      { name: 'Equipment Browse', url: '/routes/equipment' },
      { name: 'Login Page', url: '/auth/login' },
      { name: 'Stripe Test', url: '/test-stripe' },
    ];

    for (const test of tests) {
      try {
        const response = await fetch(`${this.baseUrl}${test.url}`);
        const status = response.ok ? '✅' : '❌';
        console.log(`${status} ${test.name}: ${response.status}`);
      } catch (error) {
        console.log(`❌ ${test.name}: ERROR`);
      }
    }
  }

  generateTestReport() {
    const timestamp = new Date().toLocaleString();
    console.log('\n📊 TEST REPORT TEMPLATE');
    console.log('========================');
    console.log(`Testing Date: ${timestamp}`);
    console.log('Tester: [Your Name]');
    console.log('Environment: Development (localhost:3001)');
    console.log('\nJOURNEY RESULTS:');
    console.log('□ Journey 1: ___% (___/__ tests passed)');
    console.log('□ Journey 2: ___% (___/__ tests passed)');
    console.log('□ Journey 3: ___% (___/__ tests passed)');
    console.log('□ Journey 4: ___% (___/__ tests passed)');
    console.log('□ Journey 5: ___% (___/__ tests passed)');
    console.log('□ Journey 6: ___% (___/__ tests passed)');
    console.log('\nOVERALL SCORE: ___% ');
    console.log('\nCRITICAL ISSUES:');
    console.log('1. ');
    console.log('2. ');
    console.log('3. ');
    console.log('\nREADY FOR PRODUCTION? YES/NO');
  }
}

async function main() {
  const companion = new TestingCompanion();
  
  // Show the menu
  companion.printTestingMenu();
  
  // Check if server is running
  const serverRunning = await companion.checkServerStatus();
  
  if (serverRunning) {
    // Run quick health check
    await companion.quickHealthCheck();
    
    // Show report template
    companion.generateTestReport();
  }
  
  console.log('\n🚀 Happy Testing! Open USER-JOURNEY-TESTING-CHECKLIST.md to start!');
}

main().catch(console.error); 