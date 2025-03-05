// This script helps you set up Prisma Accelerate
// Run this script to generate the necessary configuration for Prisma Accelerate

console.log('Setting up Prisma Accelerate');
console.log('----------------------------');
console.log('');
console.log('To use Prisma Accelerate, you need to:');
console.log('');
console.log('1. Sign up for Prisma Accelerate at https://cloud.prisma.io');
console.log('2. Create a new project');
console.log('3. Add your database connection string');
console.log('4. Generate an API key');
console.log('5. Update your environment variables with the Prisma Accelerate URL');
console.log('');
console.log('Your current database connection string is:');
console.log(process.env.DATABASE_URL);
console.log('');
console.log('After setting up Prisma Accelerate, update your .env.production file with:');
console.log('DATABASE_URL="prisma://aws-us-east-2.prisma-data.com/?api_key=YOUR_PRISMA_ACCELERATE_API_KEY"');
console.log('DIRECT_DATABASE_URL="' + process.env.DATABASE_URL + '"');
console.log('');
console.log('Then update your Vercel and Netlify environment variables with the same values.');
console.log('');
console.log('For more information, see: https://www.prisma.io/docs/data-platform/accelerate/getting-started'); 