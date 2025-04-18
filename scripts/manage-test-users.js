import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Test users with their roles
const testUsers = [
  { email: 'owner1@test.com', password: 'password123', name: 'Owner One', userType: 'owner' },
  { email: 'owner2@test.com', password: 'password123', name: 'Owner Two', userType: 'owner' },
  { email: 'owner3@test.com', password: 'password123', name: 'Owner Three', userType: 'owner' },
  { email: 'renter1@test.com', password: 'password123', name: 'Renter One', userType: 'renter' },
  { email: 'renter2@test.com', password: 'password123', name: 'Renter Two', userType: 'renter' },
  { email: 'admin@jackerbox.local', password: 'admin123', name: 'Admin User', userType: 'admin', isAdmin: true },
];

// Create a new user with proper password hashing
async function createUser(userData) {
  try {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        password: hashedPassword,
        userType: userData.userType,
        isAdmin: userData.isAdmin || false,
        emailVerified: new Date(), // Mark as verified for test users
      },
      create: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        userType: userData.userType,
        isAdmin: userData.isAdmin || false,
        emailVerified: new Date(), // Mark as verified for test users
      }
    });
    
    console.log(`✅ User ${userData.email} (${userData.userType}) ${user.id ? 'updated' : 'created'} successfully`);
    return user;
  } catch (error) {
    console.error(`❌ Error with user ${userData.email}:`, error);
    return null;
  }
}

// Reset a user's password
async function resetPassword(email, newPassword = 'password123') {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const user = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
    
    console.log(`✅ Password reset for ${email}`);
    console.log('User ID:', user.id);
    return user;
  } catch (error) {
    console.error(`❌ Error resetting password for ${email}:`, error);
    return null;
  }
}

// List all users
async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        isAdmin: true,
        createdAt: true
      }
    });
    
    console.log('\n===== User List =====');
    users.forEach((user, index) => {
      console.log(`\n[${index + 1}] ${user.name || 'Unnamed User'}`);
      console.log(`Email: ${user.email}`);
      console.log(`Type: ${user.userType || 'standard'}`);
      console.log(`Admin: ${user.isAdmin ? '✓' : '✗'}`);
      console.log(`ID: ${user.id}`);
      console.log(`Created: ${user.createdAt}`);
    });
    
    return users;
  } catch (error) {
    console.error('❌ Error listing users:', error);
    return [];
  }
}

// Show the menu for interactive mode
function showMenu() {
  console.log('\n===== Test User Management =====');
  console.log('1. Reset password for a specific user');
  console.log('2. Reset passwords for all test users');
  console.log('3. Create/update all test users');
  console.log('4. List all users');
  console.log('5. Exit');
  
  rl.question('\nSelect an option (1-5): ', async (answer) => {
    switch (answer) {
      case '1':
        rl.question('Enter user email: ', async (email) => {
          rl.question('Enter new password (default: password123): ', async (password) => {
            await resetPassword(email, password || 'password123');
            showMenu();
          });
        });
        break;
        
      case '2':
        console.log('\nResetting passwords for all test users...');
        for (const user of testUsers) {
          await resetPassword(user.email, user.password);
        }
        showMenu();
        break;
        
      case '3':
        console.log('\nCreating/updating all test users...');
        for (const user of testUsers) {
          await createUser(user);
        }
        showMenu();
        break;
        
      case '4':
        await listUsers();
        showMenu();
        break;
        
      case '5':
        console.log('Exiting...');
        await prisma.$disconnect();
        rl.close();
        break;
        
      default:
        console.log('Invalid option. Please try again.');
        showMenu();
        break;
    }
  });
}

// Process command line arguments for non-interactive usage
async function processCommandLineArgs() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    // No command specified, show interactive menu
    return false;
  }
  
  switch (command) {
    case '--reset-all':
      console.log('\nResetting passwords for all test users...');
      for (const user of testUsers) {
        await resetPassword(user.email, user.password);
      }
      break;
      
    case '--create-all':
      console.log('\nCreating/updating all test users...');
      for (const user of testUsers) {
        await createUser(user);
      }
      break;
      
    case '--list':
      await listUsers();
      break;
      
    case '--reset':
      if (args[1]) {
        const password = args[2] || 'password123';
        await resetPassword(args[1], password);
      } else {
        console.error('Email is required for --reset');
      }
      break;
      
    case '--help':
      console.log('\nAvailable commands:');
      console.log('--reset-all           Reset passwords for all test users');
      console.log('--create-all          Create/update all test users');
      console.log('--list                List all users');
      console.log('--reset EMAIL [PWD]   Reset password for a specific user');
      console.log('--help                Show this help message');
      break;
      
    default:
      console.log('Unknown command. Use --help to see available commands.');
      return false;
  }
  
  return true;
}

// Start the script
async function main() {
  console.log('🔧 Jackerbox Test User Management Tool');
  
  // Check if command line args were provided
  const hasProcessedArgs = await processCommandLineArgs();
  
  // If no args were processed, show interactive menu
  if (!hasProcessedArgs) {
    showMenu();
  } else {
    // Clean up if args were processed
    await prisma.$disconnect();
  }
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
}); 