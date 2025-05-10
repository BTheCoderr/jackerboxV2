const fs = require('fs');
const readline = require('readline');
const { Pool } = require('pg');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask user questions
function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function testConnection(connectionString, sslMode = true) {
  const sslOptions = sslMode ? {
    rejectUnauthorized: true
  } : false;

  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 10000,
    ssl: sslOptions
  });

  try {
    console.log('Testing connection to database...');
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT current_database() as db_name');
      console.log('Success! Connected to database:', result.rows[0].db_name);
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Connection error:', error.message);
    
    // If SSL error and we haven't tried without SSL yet, try without SSL
    if (sslMode && (error.message.includes('SSL') || error.message.includes('ssl'))) {
      console.log('Trying connection without SSL...');
      return await testConnection(connectionString, false);
    }
    
    return false;
  } finally {
    await pool.end();
  }
}

async function checkDisableAutosuspend(connectionString) {
  if (connectionString.includes('neon.tech')) {
    console.log('\nNote: To completely disable auto-suspend in Neon, you need to update your settings in the Neon dashboard.');
    console.log('Go to: https://console.neon.tech/app/projects/');
    console.log('Select your project -> Branches -> Select your branch -> Compute -> Edit compute settings');
    console.log('There you can disable "Scale to zero" to keep your compute always running.\n');
  }
  
  const answer = await askQuestion('Would you like to try connecting to the database now? (y/n): ');
  
  if (answer.toLowerCase() === 'y') {
    await testConnection(connectionString);
  }
}

async function main() {
  try {
    console.log('=== Database Connection Setup ===');
    console.log('This script will help you set up your database connection with proper configuration.\n');
    
    // Check if .env exists
    let connectionString = '';
    let useSSL = true;
    
    if (fs.existsSync('.env')) {
      const envContent = fs.readFileSync('.env', 'utf8');
      const match = envContent.match(/DATABASE_URL=["']?(.*?)["']?$/m);
      if (match && match[1]) {
        connectionString = match[1];
        console.log('Found existing DATABASE_URL in .env file.');
        const useExisting = await askQuestion('Would you like to use this connection string? (y/n): ');
        
        if (useExisting.toLowerCase() !== 'y') {
          connectionString = await askQuestion('Please enter your database connection string: ');
        }
      } else {
        connectionString = await askQuestion('Please enter your database connection string: ');
      }
    } else {
      connectionString = await askQuestion('Please enter your database connection string: ');
    }
    
    // Ask about SSL
    const sslAnswer = await askQuestion('Does your database require SSL? (y/n/auto): ');
    if (sslAnswer.toLowerCase() === 'n') {
      useSSL = false;
    } else if (sslAnswer.toLowerCase() === 'auto') {
      // We'll try both in the test connection
      useSSL = null;
    }
    
    // Test connection
    const isConnected = await testConnection(connectionString, useSSL);
    
    if (isConnected) {
      // Ask about connection pooling
      console.log('\nYou should configure connection pooling to handle database reconnections.');
      const poolConfig = await askQuestion('Enter max number of connections in the pool (recommended: 20): ');
      
      // Create or update .env file
      let envContent = '';
      if (fs.existsSync('.env')) {
        envContent = fs.readFileSync('.env', 'utf8');
        
        // Update DATABASE_URL if it exists
        if (envContent.includes('DATABASE_URL=')) {
          envContent = envContent.replace(/DATABASE_URL=["']?.*?["']?$/m, `DATABASE_URL='${connectionString}'`);
        } else {
          envContent += `\nDATABASE_URL='${connectionString}'`;
        }
        
        // Add or update SSL settings
        if (envContent.includes('DATABASE_SSL=')) {
          envContent = envContent.replace(/DATABASE_SSL=["']?.*?["']?$/m, `DATABASE_SSL='${useSSL !== false}'`);
        } else {
          envContent += `\nDATABASE_SSL='${useSSL !== false}'`;
        }
        
        // Add or update pooling configuration
        if (envContent.includes('PG_POOL_MAX=')) {
          envContent = envContent.replace(/PG_POOL_MAX=\d+/m, `PG_POOL_MAX=${poolConfig}`);
        } else {
          envContent += `\nPG_POOL_MAX=${poolConfig}`;
        }
        
        // Add connection retry settings
        if (!envContent.includes('PG_CONNECTION_RETRIES=')) {
          envContent += `\nPG_CONNECTION_RETRIES=3`;
        }
      } else {
        envContent = `DATABASE_URL='${connectionString}'\nDATABASE_SSL='${useSSL !== false}'\nPG_POOL_MAX=${poolConfig}\nPG_CONNECTION_RETRIES=3`;
      }
      
      // Write to .env
      fs.writeFileSync('.env', envContent);
      console.log('\n.env file has been updated with your database configuration.');
      
      // Check about auto-suspend
      await checkDisableAutosuspend(connectionString);
      
      console.log('\nSetup complete!');
      console.log('Your application should now be configured to better handle database reconnections.');
      console.log('Make sure to use the connection pool or retry-enabled clients in your application.');
    } else {
      console.log('\nFailed to connect to the database. Please check your connection string and try again.');
    }
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    rl.close();
  }
}

// Run the main function
main(); 