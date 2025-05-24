#!/usr/bin/env npx tsx

import 'dotenv/config';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  details?: string;
  time?: number;
}

class JackerboxTester {
  private baseUrl = 'http://localhost:3001';
  private results: TestResult[] = [];

  async runTest(testName: string, testFn: () => Promise<void>) {
    const startTime = Date.now();
    console.log(`🧪 Testing: ${testName}...`);
    
    try {
      await testFn();
      const time = Date.now() - startTime;
      this.results.push({ test: testName, status: 'PASS', time });
      console.log(`✅ ${testName} - PASSED (${time}ms)\n`);
    } catch (error) {
      const time = Date.now() - startTime;
      this.results.push({ 
        test: testName, 
        status: 'FAIL', 
        details: error instanceof Error ? error.message : String(error),
        time 
      });
      console.log(`❌ ${testName} - FAILED (${time}ms)`);
      console.log(`   Error: ${error}\n`);
    }
  }

  async testPageLoad(path: string, expectedContent?: string) {
    const response = await fetch(`${this.baseUrl}${path}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    if (expectedContent) {
      const html = await response.text();
      if (!html.includes(expectedContent)) {
        throw new Error(`Expected content "${expectedContent}" not found`);
      }
    }
  }

  async testApiEndpoint(path: string, method: 'GET' | 'POST' = 'GET', body?: any, expectAuth = false) {
    const options: RequestInit = { method };
    
    if (body && method === 'POST') {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${this.baseUrl}${path}`, options);
    
    // For protected endpoints, 401 Unauthorized is a SUCCESS (means auth is working)
    if (expectAuth && response.status === 401) {
      const data = await response.json();
      if (data.error === 'Unauthorized' || data.message === 'Unauthorized') {
        return { status: 'auth_protected', message: 'Endpoint properly protected' };
      }
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  async runAllTests() {
    console.log('🚀 Starting Jackerbox Comprehensive Test Suite\n');
    console.log('='.repeat(50));

    // 1. Core Pages Loading
    await this.runTest('Home Page Load', async () => {
      await this.testPageLoad('/', 'Jackerbox');
    });

    await this.runTest('Equipment Browse Page', async () => {
      await this.testPageLoad('/routes/equipment', 'Browse Equipment');
    });

    await this.runTest('Login Page Load', async () => {
      await this.testPageLoad('/auth/login');
    });

    await this.runTest('Register Page Load', async () => {
      await this.testPageLoad('/auth/register');
    });

    // 2. API Endpoints
    await this.runTest('Database Connection', async () => {
      await this.testApiEndpoint('/api/health');
    });

    await this.runTest('Stripe Payment Intent Creation', async () => {
      const result = await this.testApiEndpoint('/api/payments/test-intent', 'POST', {
        amount: 1000
      });
      if (!result.clientSecret || !result.paymentIntentId) {
        throw new Error('Invalid payment intent response');
      }
    });

    await this.runTest('Equipment API Endpoint', async () => {
      await this.testApiEndpoint('/api/equipment');
    });

    // 3. Authentication System
    await this.runTest('NextAuth Configuration', async () => {
      await this.testApiEndpoint('/api/auth/providers');
    });

    await this.runTest('Session Endpoint', async () => {
      await this.testApiEndpoint('/api/auth/session');
    });

    // 4. Search and Filter
    await this.runTest('Equipment Search API', async () => {
      await this.testApiEndpoint('/api/equipment?query=camera');
    });

    await this.runTest('Category Filter API', async () => {
      await this.testApiEndpoint('/api/equipment?category=cameras');
    });

    // 5. User Management (Protected - expects 401)
    await this.runTest('User Profile API', async () => {
      await this.testApiEndpoint('/api/user/profile', 'GET', undefined, true);
    });

    // 6. Rental System (Protected - expects 401)
    await this.runTest('Rental Booking API', async () => {
      await this.testApiEndpoint('/api/rentals', 'GET', undefined, true);
    });

    // 7. File Upload (GET is public, POST is protected)
    await this.runTest('Image Upload API', async () => {
      await this.testApiEndpoint('/api/upload/images');
    });

    // 8. Notifications (Protected - expects 401)
    await this.runTest('Notifications API', async () => {
      await this.testApiEndpoint('/api/notifications', 'GET', undefined, true);
    });

    // 9. Messaging System (Protected - expects 401)
    await this.runTest('Messages API', async () => {
      await this.testApiEndpoint('/api/messages', 'GET', undefined, true);
    });

    // 10. Stripe Webhooks (already tested)
    await this.runTest('Stripe Webhook Endpoint', async () => {
      const response = await fetch(`${this.baseUrl}/api/webhooks/stripe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'test' })
      });
      // Webhook should handle invalid requests gracefully
      if (response.status !== 400 && response.status !== 200) {
        throw new Error(`Unexpected response: ${response.status}`);
      }
    });

    // 11. Mobile Responsiveness Check
    await this.runTest('Mobile Layout Detection', async () => {
      const html = await fetch(`${this.baseUrl}/`).then(r => r.text());
      if (!html.includes('viewport') || !html.includes('mobile-web-app-capable')) {
        throw new Error('Mobile meta tags not found');
      }
    });

    // 12. SEO and Performance
    await this.runTest('SEO Meta Tags', async () => {
      const html = await fetch(`${this.baseUrl}/`).then(r => r.text());
      if (!html.includes('description') || !html.includes('og:title')) {
        throw new Error('Essential SEO tags missing');
      }
    });

    await this.runTest('PWA Manifest', async () => {
      await this.testPageLoad('/site.webmanifest');
    });

    // 13. Error Handling
    await this.runTest('404 Error Handling', async () => {
      const response = await fetch(`${this.baseUrl}/nonexistent-page`);
      if (response.status !== 404) {
        throw new Error('404 page not working correctly');
      }
    });

    // 14. Security Headers
    await this.runTest('Security Headers Check', async () => {
      const response = await fetch(`${this.baseUrl}/`);
      const headers = response.headers;
      
      // Check for important security headers
      if (!headers.get('x-dns-prefetch-control')) {
        throw new Error('DNS prefetch control header missing');
      }
    });

    this.printResults();
  }

  printResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📈 Success Rate: ${Math.round((passed / this.results.length) * 100)}%`);

    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`   - ${result.test}: ${result.details}`);
        });
    }

    console.log('\n🎯 NEXT STEPS:');
    
    if (passed >= 10) {
      console.log('✅ Core functionality is working well!');
      console.log('🚀 Ready for user testing and deployment preparation');
    } else if (passed >= 7) {
      console.log('⚠️  Most features working, but some issues need attention');
      console.log('🔧 Focus on fixing failed tests before deployment');
    } else {
      console.log('🚨 Multiple critical issues detected');
      console.log('🛠️  Significant work needed before deployment');
    }

    console.log('\n📋 RECOMMENDED TESTING ORDER:');
    console.log('1. Manual UI testing in browser');
    console.log('2. User registration/login flow');
    console.log('3. Equipment listing creation');
    console.log('4. Booking and payment flow');
    console.log('5. Mobile device testing');
    console.log('6. Performance optimization');
  }
}

// Run the tests
const tester = new JackerboxTester();
tester.runAllTests().catch(console.error); 