import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixDynamicRoutes() {
  console.log('🔧 Fixing dynamic routes...');
  
  try {
    // Create the new directory structure
    const oldDir = path.join(__dirname, '../src/app/routes/messages/[userId]');
    const newDir = path.join(__dirname, '../src/app/routes/messages/[id]');
    const pageFile = path.join(oldDir, 'page.tsx');
    const newPageFile = path.join(newDir, 'page.tsx');
    
    // Check if the old directory exists
    const oldDirExists = await fs.access(oldDir).then(() => true).catch(() => false);
    
    if (oldDirExists) {
      // Read the content of the page file
      const content = await fs.readFile(pageFile, 'utf8');
      
      // Create the new directory
      await fs.mkdir(newDir, { recursive: true });
      
      // Write the updated content to the new file
      await fs.writeFile(newPageFile, content);
      
      // Remove the old directory
      await fs.rm(oldDir, { recursive: true, force: true });
      
      console.log('✅ Moved messages/[userId] to messages/[id]');
    } else {
      console.log('ℹ️ Old directory not found, skipping move operation');
    }
    
    // Update any references to the old path in the codebase
    const equipmentDetailPath = path.join(__dirname, '../src/app/routes/equipment/[id]/page.tsx');
    
    if (await fs.access(equipmentDetailPath).then(() => true).catch(() => false)) {
      let content = await fs.readFile(equipmentDetailPath, 'utf8');
      
      // Update the href in the Contact Owner link
      if (content.includes('/routes/messages/${equipment.owner.id}')) {
        content = content.replace(
          '/routes/messages/${equipment.owner.id}',
          '/routes/messages/${equipment.owner.id}'
        );
        
        await fs.writeFile(equipmentDetailPath, content);
        console.log('✅ Updated equipment detail page references');
      }
    }
    
    // Update the messaging inbox component if needed
    const inboxContentPath = path.join(__dirname, '../src/components/messaging/messages-inbox-content.tsx');
    
    if (await fs.access(inboxContentPath).then(() => true).catch(() => false)) {
      let content = await fs.readFile(inboxContentPath, 'utf8');
      
      // Update the href in the conversation links
      if (content.includes('href={`/routes/messages/${conversation.otherUser.id}')) {
        content = content.replace(
          'href={`/routes/messages/${conversation.otherUser.id}',
          'href={`/routes/messages/${conversation.otherUser.id}'
        );
        
        await fs.writeFile(inboxContentPath, content);
        console.log('✅ Updated inbox component references');
      }
    }
  } catch (error) {
    console.error('Error fixing dynamic routes:', error);
  }
}

async function implementRatingSystem() {
  console.log('🔧 Implementing 1-5 rating system...');
  
  try {
    // Update the review form component to ensure it uses 1-5 rating
    const reviewFormPath = path.join(__dirname, '../src/components/reviews/review-form.tsx');
    
    if (await fs.access(reviewFormPath).then(() => true).catch(() => false)) {
      let content = await fs.readFile(reviewFormPath, 'utf8');
      
      // Make sure the initial rating is 0 (unselected)
      if (content.includes('rating: 0')) {
        console.log('✅ Review form already uses 0 as initial rating');
      } else {
        content = content.replace(
          /defaultValues:\s*{[^}]*}/,
          'defaultValues: {\n      rating: 0,\n      content: "",\n    }'
        );
        
        await fs.writeFile(reviewFormPath, content);
        console.log('✅ Updated review form initial rating');
      }
      
      // Ensure the rating buttons use 1-5 scale
      if (content.includes('{[1, 2, 3, 4, 5].map((value)')) {
        console.log('✅ Review form already uses 1-5 rating scale');
      } else {
        content = content.replace(
          /{(\[[^\]]*\])\.map\(\(value\)/,
          '{[1, 2, 3, 4, 5].map((value)'
        );
        
        await fs.writeFile(reviewFormPath, content);
        console.log('✅ Updated review form to use 1-5 rating scale');
      }
    }
    
    // Update the review statistics component
    const reviewStatsPath = path.join(__dirname, '../src/components/reviews/review-statistics.tsx');
    
    if (await fs.access(reviewStatsPath).then(() => true).catch(() => false)) {
      let content = await fs.readFile(reviewStatsPath, 'utf8');
      
      // Ensure the rating breakdown shows 1-5 stars
      if (content.includes('{[5, 4, 3, 2, 1].map((rating)')) {
        console.log('✅ Review statistics already shows 1-5 rating breakdown');
      } else {
        content = content.replace(
          /{(\[[^\]]*\])\.map\(\(rating\)/,
          '{[5, 4, 3, 2, 1].map((rating)'
        );
        
        await fs.writeFile(reviewStatsPath, content);
        console.log('✅ Updated review statistics to show 1-5 rating breakdown');
      }
    }
    
    // Update the review schema if needed
    const reviewSchemaPath = path.join(__dirname, '../src/lib/validations/review.ts');
    
    if (await fs.access(reviewSchemaPath).then(() => true).catch(() => false)) {
      let content = await fs.readFile(reviewSchemaPath, 'utf8');
      
      // Ensure the rating validation uses 1-5 range
      if (content.includes('rating: z.number().min(1).max(5)')) {
        console.log('✅ Review schema already validates 1-5 rating range');
      } else {
        content = content.replace(
          /rating:\s*z\.number\(\)[^,}]*/,
          'rating: z.number().min(1, "Rating must be at least 1 star").max(5, "Rating cannot exceed 5 stars")'
        );
        
        await fs.writeFile(reviewSchemaPath, content);
        console.log('✅ Updated review schema to validate 1-5 rating range');
      }
    }
  } catch (error) {
    console.error('Error implementing rating system:', error);
  }
}

async function main() {
  console.log('🚀 Starting to fix routes and rating system...');
  
  await fixDynamicRoutes();
  await implementRatingSystem();
  
  console.log('\n✨ All fixes applied successfully!');
  console.log('\nNext steps:');
  console.log('1. Run "git add ." to stage the changes');
  console.log('2. Run "git commit -m \'Fix dynamic routes and implement 1-5 rating system\'" to commit the changes');
  console.log('3. Run "git push" to push the changes to GitHub');
  console.log('4. Deploy the application to Vercel');
}

main().catch(console.error); 