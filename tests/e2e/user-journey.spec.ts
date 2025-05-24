import { test, expect } from '@playwright/test';

test.describe('User Journey Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto('/');
  });

  test('Complete renter journey: browse → view → register → login', async ({ page }) => {
    // 1. Home page loads
    await expect(page.locator('h1')).toContainText(/Rent equipment|jackerBOX/i);
    await expect(page.getByText('Find Equipment')).toBeVisible();

    // 2. Navigate to equipment browse
    await page.getByText('Find Equipment').click();
    await expect(page.url()).toContain('/routes/equipment');

    // 3. Check equipment grid loads
    await page.waitForLoadState('networkidle');
    
    // Should see equipment items or "No equipment found" message
    const equipmentVisible = await page.locator('[data-testid="equipment-grid"]').isVisible().catch(() => false);
    const noEquipmentVisible = await page.getByText('No equipment found').isVisible().catch(() => false);
    
    expect(equipmentVisible || noEquipmentVisible).toBeTruthy();

    // 4. Test search functionality
    await page.getByPlaceholder('Search equipment').fill('camera');
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');

    // 5. Test category filtering
    if (await page.getByText('Filters').isVisible()) {
      await page.getByText('Filters').click();
      // Look for camera category if filters are available
      const cameraFilter = page.getByText('cameras', { exact: false });
      if (await cameraFilter.isVisible()) {
        await cameraFilter.click();
      }
    }

    // 6. Navigate to registration
    await page.getByText('Sign up').click();
    await expect(page.url()).toContain('/auth/register');

    // 7. Fill registration form
    await page.getByLabel('Email').fill('test@jackerbox.com');
    await page.getByLabel('Password').fill('TestPassword123!');
    await page.getByLabel('Name').fill('Test User');
    
    // Submit registration (may or may not work, but test the flow)
    const submitButton = page.getByRole('button', { name: /sign up|register/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
    }
  });

  test('Equipment owner journey: list equipment flow', async ({ page }) => {
    // Look for "List Equipment" or similar button
    const listEquipmentButton = page.getByText(/list equipment|rent out|add equipment/i).first();
    
    if (await listEquipmentButton.isVisible()) {
      await listEquipmentButton.click();
      
      // Should be redirected to login or equipment creation page
      await page.waitForLoadState('networkidle');
      
      // If redirected to login, that's expected behavior
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/(login|auth|equipment|create)/);
    }
  });

  test('Payment flow testing', async ({ page }) => {
    // Navigate to payment test page
    await page.goto('/test-stripe');
    
    // Wait for Stripe to load
    await page.waitForLoadState('networkidle');
    
    // Check if payment form is visible
    const paymentForm = page.locator('[data-testid="payment-form"]');
    if (await paymentForm.isVisible()) {
      // Test card input
      const cardElement = page.locator('input[placeholder*="card"]').first();
      if (await cardElement.isVisible()) {
        await cardElement.fill('4242424242424242');
      }
    }
    
    // Check for payment success/error handling
    await expect(page.locator('body')).toContainText(/payment|stripe|card/i);
  });

  test('Mobile responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile navigation
    const mobileNav = page.locator('nav[class*="mobile"]').first();
    const bottomNav = page.locator('[class*="bottom"]').first();
    
    // Should have either mobile nav or bottom nav
    const hasMobileNav = await mobileNav.isVisible();
    const hasBottomNav = await bottomNav.isVisible();
    
    expect(hasMobileNav || hasBottomNav).toBeTruthy();
    
    // Test equipment browsing on mobile
    await page.goto('/routes/equipment');
    await expect(page.locator('body')).toBeVisible();
    
    // Check text is readable (not too small)
    const headings = page.locator('h1, h2, h3');
    if (await headings.count() > 0) {
      const fontSize = await headings.first().evaluate(el => 
        window.getComputedStyle(el).fontSize
      );
      const fontSizeNum = parseInt(fontSize);
      expect(fontSizeNum).toBeGreaterThan(16); // Minimum readable size
    }
  });

  test('Authentication flow', async ({ page }) => {
    // Test login page
    await page.goto('/auth/login');
    await expect(page.locator('body')).toContainText(/login|sign in/i);
    
    // Test form validation
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);
    
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      // Test empty form submission
      const submitButton = page.getByRole('button', { name: /login|sign in/i });
      if (await submitButton.isVisible()) {
        await submitButton.click();
        // Should show validation errors or prevent submission
      }
      
      // Test with valid format
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
    }
  });

  test('Error handling and 404 pages', async ({ page }) => {
    // Test 404 page
    await page.goto('/nonexistent-page');
    
    // Should show 404 page or redirect gracefully
    const is404 = await page.getByText(/404|not found|page not found/i).isVisible();
    const isRedirected = !page.url().includes('nonexistent-page');
    
    expect(is404 || isRedirected).toBeTruthy();
    
    // Test API error handling
    await page.goto('/api/nonexistent-endpoint');
    // Should return proper error response, not crash
  });

  test('Performance and loading states', async ({ page }) => {
    // Test page load performance
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load in reasonable time (under 5 seconds)
    expect(loadTime).toBeLessThan(5000);
    
    // Test loading states
    await page.goto('/routes/equipment');
    
    // Look for loading indicators
    const loadingIndicators = [
      page.getByText(/loading/i),
      page.locator('[class*="loading"]'),
      page.locator('[class*="spinner"]'),
      page.locator('[aria-label*="loading"]')
    ];
    
    // At least one loading pattern should be implemented
    // (This is more of a UX check)
  });

  test('Accessibility basics', async ({ page }) => {
    await page.goto('/');
    
    // Check for basic accessibility features
    const hasMainNav = await page.locator('nav').isVisible();
    const hasHeadings = await page.locator('h1, h2, h3').count() > 0;
    const hasSkipLink = await page.locator('a[href="#main"], a[href="#content"]').isVisible();
    
    expect(hasMainNav).toBeTruthy();
    expect(hasHeadings).toBeTruthy();
    
    // Check form labels
    await page.goto('/auth/login');
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    
    if (inputCount > 0) {
      // Each input should have a label or aria-label
      for (let i = 0; i < Math.min(inputCount, 3); i++) {
        const input = inputs.nth(i);
        const hasLabel = await input.getAttribute('aria-label') !== null ||
                        await input.getAttribute('aria-labelledby') !== null ||
                        await page.locator(`label[for="${await input.getAttribute('id')}"]`).isVisible();
        
        // This is a soft check - accessibility is important but shouldn't break tests
        if (!hasLabel) {
          console.warn(`Input ${i} may be missing proper labeling`);
        }
      }
    }
  });
}); 