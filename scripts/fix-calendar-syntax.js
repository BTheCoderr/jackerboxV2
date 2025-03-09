import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixCalendarSyntax() {
  console.log('🔧 Fixing availability calendar syntax errors...');
  
  const calendarComponentPath = path.join(__dirname, '../src/components/equipment/availability-calendar.tsx');
  
  try {
    let content = await fs.readFile(calendarComponentPath, 'utf8');
    
    // Fix 1: Remove duplicate else statement
    content = content.replace(
      /}\s*}\s*else\s*{\s*}\s*else\s*{/g,
      '} }'
    );
    
    // Fix 2: Fix the generateRecurringDates function syntax
    content = content.replace(
      /const generateRecurringDates = \(\) =>\s*{\s*{\s*{/g,
      'const generateRecurringDates = () => {'
    );
    
    // Fix 3: Fix the closing braces of generateRecurringDates
    content = content.replace(
      /return dates;\s*}\s*}\s*}/g,
      'return dates;\n  };'
    );
    
    // Fix 4: Fix the handleSaveAvailability function
    // Look for the pattern where we have a missing else statement
    const handleSaveAvailabilityPattern = /if \(isRecurring && recurrenceEndDate\) {[\s\S]*?setEvents\(\[\.\.\.events, \.\.\.newEvents\]\);\s*}\s*\/\/ Handle single availability/g;
    
    if (handleSaveAvailabilityPattern.test(content)) {
      content = content.replace(
        handleSaveAvailabilityPattern,
        (match) => match.replace('} // Handle single availability', '} else { // Handle single availability')
      );
    }
    
    // Fix 5: Fix any missing closing braces in handleSaveAvailability
    const missingBracePattern = /className: "bg-green-200",\s*},\s*\]\);\s*}/g;
    
    if (missingBracePattern.test(content)) {
      content = content.replace(
        missingBracePattern,
        (match) => match.replace('});', '});\n      }')
      );
    }
    
    await fs.writeFile(calendarComponentPath, content);
    console.log('✅ Fixed availability calendar syntax errors');
    
    // Verify the fixes
    const fixedContent = await fs.readFile(calendarComponentPath, 'utf8');
    
    // Check for remaining issues
    const remainingIssues = [];
    
    if (fixedContent.includes('} else {') && fixedContent.includes('} else {')) {
      remainingIssues.push('Duplicate else statement still exists');
    }
    
    if (fixedContent.includes('const generateRecurringDates = () => { { {')) {
      remainingIssues.push('generateRecurringDates function still has syntax errors');
    }
    
    if (remainingIssues.length > 0) {
      console.log('⚠️ Some issues may still remain:');
      remainingIssues.forEach(issue => console.log(`  - ${issue}`));
      console.log('Consider manually checking the file.');
    } else {
      console.log('✅ All syntax issues appear to be fixed');
    }
  } catch (error) {
    console.error('Error fixing calendar syntax:', error);
  }
}

async function main() {
  console.log('🚀 Starting to fix calendar syntax issues...');
  
  await fixCalendarSyntax();
  
  console.log('\n✨ Fixes applied!');
}

main().catch(console.error); 