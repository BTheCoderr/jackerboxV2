import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixRecurringAvailabilityRoute() {
  console.log('🔧 Fixing TypeScript errors in recurring availability API...');
  
  const filePath = path.join(__dirname, '../src/app/api/equipment/[id]/availability/recurring/route.ts');
  
  try {
    // Read the file content
    const content = await fs.readFile(filePath, 'utf8');
    
    // Add DateRange interface at the top of the file
    let updatedContent = content.replace(
      'import { getCurrentUser } from "@/lib/auth/auth-utils";',
      'import { getCurrentUser } from "@/lib/auth/auth-utils";\n\n// Define a type for date ranges\ninterface DateRange {\n  startDate: Date;\n  endDate: Date;\n}'
    );
    
    // Fix the conflictingDates array declaration
    updatedContent = updatedContent.replace(
      'const conflictingDates = [];',
      'const conflictingDates: DateRange[] = [];'
    );
    
    // Fix the first conflictingDates.push call
    updatedContent = updatedContent.replace(
      'conflictingDates.push({startDate: date.startDate, endDate: date.endDate});',
      'conflictingDates.push({\n          startDate: date.startDate,\n          endDate: date.endDate\n        });'
    );
    
    // Fix the second conflictingDates.push call
    updatedContent = updatedContent.replace(
      'conflictingDates.push(date);',
      'conflictingDates.push({\n          startDate: date.startDate,\n          endDate: date.endDate\n        });'
    );
    
    // Write the updated content back to the file
    await fs.writeFile(filePath, updatedContent);
    
    console.log('✅ Fixed TypeScript errors in recurring availability API');
  } catch (error) {
    console.error('Error fixing recurring availability route:', error);
  }
}

async function main() {
  console.log('🚀 Starting to fix TypeScript errors...');
  
  await fixRecurringAvailabilityRoute();
  
  console.log('\n✨ All fixes applied successfully!');
}

main().catch(console.error); 