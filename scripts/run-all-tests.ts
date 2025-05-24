#!/usr/bin/env npx tsx

import { spawn } from 'child_process';
import chalk from 'chalk';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  output?: string;
}

class ComprehensiveTestRunner {
  private results: TestResult[] = [];

  async runCommand(command: string, args: string[], name: string): Promise<TestResult> {
    console.log(chalk.blue(`\n🚀 Running ${name}...`));
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const process = spawn(command, args, { stdio: 'pipe' });
      let output = '';
      
      process.stdout?.on('data', (data) => {
        output += data.toString();
        console.log(data.toString());
      });
      
      process.stderr?.on('data', (data) => {
        output += data.toString();
        console.error(data.toString());
      });
      
      process.on('close', (code) => {
        const duration = Date.now() - startTime;
        const status = code === 0 ? 'PASS' : 'FAIL';
        
        resolve({
          name,
          status,
          duration,
          output
        });
      });
    });
  }

  async runAllTests() {
    console.log(chalk.yellow('🧪 COMPREHENSIVE JACKERBOX TEST SUITE'));
    console.log(chalk.yellow('=====================================\n'));

    // 1. Smoke Test (our existing comprehensive test)
    const smokeTest = await this.runCommand('npx', ['tsx', 'scripts/comprehensive-app-test.ts'], 'Smoke Test');
    this.results.push(smokeTest);

    // 2. Unit Tests
    try {
      const unitTest = await this.runCommand('npm', ['run', 'test:unit'], 'Unit Tests');
      this.results.push(unitTest);
    } catch (error) {
      this.results.push({
        name: 'Unit Tests',
        status: 'SKIP',
        duration: 0,
        output: 'Dependencies not installed'
      });
    }

    // 3. Integration Tests
    try {
      const integrationTest = await this.runCommand('npm', ['run', 'test:integration'], 'Integration Tests');
      this.results.push(integrationTest);
    } catch (error) {
      this.results.push({
        name: 'Integration Tests',
        status: 'SKIP',
        duration: 0,
        output: 'Dependencies not installed'
      });
    }

    // 4. Security Audit
    const securityTest = await this.runCommand('npm', ['audit'], 'Security Audit');
    this.results.push(securityTest);

    // 5. Check if server is running for E2E tests
    console.log(chalk.blue('\n🌐 Checking if server is running for E2E tests...'));
    try {
      const response = await fetch('http://localhost:3001/api/health');
      if (response.ok) {
        console.log(chalk.green('✅ Server is running, E2E tests can proceed'));
        
        // Run E2E tests if Playwright is available
        try {
          const e2eTest = await this.runCommand('npx', ['playwright', 'test', '--reporter=line'], 'E2E Tests');
          this.results.push(e2eTest);
        } catch (error) {
          this.results.push({
            name: 'E2E Tests',
            status: 'SKIP',
            duration: 0,
            output: 'Playwright not installed'
          });
        }
      } else {
        console.log(chalk.red('❌ Server not responding, skipping E2E tests'));
        this.results.push({
          name: 'E2E Tests',
          status: 'SKIP',
          duration: 0,
          output: 'Server not running'
        });
      }
    } catch (error) {
      console.log(chalk.red('❌ Server not running, skipping E2E tests'));
      this.results.push({
        name: 'E2E Tests',
        status: 'SKIP',
        duration: 0,
        output: 'Server not accessible'
      });
    }

    this.printSummary();
  }

  printSummary() {
    console.log(chalk.yellow('\n📊 COMPREHENSIVE TEST RESULTS'));
    console.log(chalk.yellow('==============================='));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\n${chalk.green('✅ Passed:')} ${passed}`);
    console.log(`${chalk.red('❌ Failed:')} ${failed}`);
    console.log(`${chalk.yellow('⏭️  Skipped:')} ${skipped}`);
    console.log(`${chalk.blue('⏱️  Total Time:')} ${(totalTime / 1000).toFixed(2)}s`);

    console.log('\n📋 DETAILED RESULTS:');
    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
      const time = (result.duration / 1000).toFixed(2);
      console.log(`${icon} ${result.name} - ${result.status} (${time}s)`);
    });

    if (failed > 0) {
      console.log(chalk.red('\n🚨 FAILED TESTS:'));
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(chalk.red(`   - ${result.name}`));
        });
    }

    if (skipped > 0) {
      console.log(chalk.yellow('\n⚠️  SKIPPED TESTS:'));
      this.results
        .filter(r => r.status === 'SKIP')
        .forEach(result => {
          console.log(chalk.yellow(`   - ${result.name}: ${result.output}`));
        });
    }

    // Final recommendations
    console.log(chalk.blue('\n🎯 RECOMMENDATIONS:'));
    
    if (passed >= 3) {
      console.log(chalk.green('✅ Core functionality is solid!'));
    }
    
    if (failed === 0 && passed >= 2) {
      console.log(chalk.green('🚀 Ready for manual testing!'));
      console.log(chalk.blue('📋 Next: Run the manual testing checklist'));
    }
    
    if (skipped > 0) {
      console.log(chalk.yellow('🔧 Install missing dependencies to run all tests:'));
      console.log(chalk.yellow('   npm install --save-dev --legacy-peer-deps [missing packages]'));
    }

    const successRate = Math.round((passed / (passed + failed)) * 100);
    console.log(chalk.blue(`\n📈 Success Rate: ${successRate}% (${passed}/${passed + failed})`));
    
    if (successRate >= 80) {
      console.log(chalk.green('🎉 EXCELLENT! Ready for production!'));
    } else if (successRate >= 60) {
      console.log(chalk.yellow('⚠️  GOOD - Address failed tests before deployment'));
    } else {
      console.log(chalk.red('🚨 NEEDS WORK - Multiple critical issues'));
    }
  }
}

// Run all tests
const runner = new ComprehensiveTestRunner();
runner.runAllTests().catch(console.error); 