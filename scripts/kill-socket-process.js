#!/usr/bin/env node

/**
 * This script finds and kills any processes using port 3001 (the socket server port)
 * Useful when you get the EADDRINUSE error
 */

import { execSync } from 'child_process';
import os from 'os';

const PORT = 3001;
const ADDITIONAL_PORTS = [3002, 3003, 3004, 3005]; // Check additional ports that might be used by the socket server

function findAndKillProcess(port) {
  try {
    console.log(`Looking for processes using port ${port}...`);
    
    let command;
    let processIdCommand;
    
    if (os.platform() === 'win32') {
      // Windows
      command = `netstat -ano | findstr :${port}`;
      processIdCommand = (output) => {
        const lines = output.split('\n');
        const pids = new Set();
        for (const line of lines) {
          if (line.includes(`LISTENING`)) {
            const parts = line.trim().split(/\s+/);
            pids.add(parts[parts.length - 1]);
          }
        }
        return Array.from(pids);
      };
    } else {
      // macOS, Linux
      command = `lsof -i :${port} -t`;
      processIdCommand = (output) => {
        const lines = output.trim().split('\n');
        return lines.filter(line => line.trim() !== '');
      };
    }
    
    const output = execSync(command, { encoding: 'utf8' });
    const processIds = processIdCommand(output);
    
    if (!processIds.length) {
      console.log(`No process found using port ${port}`);
      return 0;
    }
    
    console.log(`Found ${processIds.length} process(es) using port ${port}: ${processIds.join(', ')}`);
    
    // Kill each process
    let killedCount = 0;
    for (const pid of processIds) {
      try {
        if (os.platform() === 'win32') {
          execSync(`taskkill /F /PID ${pid}`);
        } else {
          execSync(`kill -9 ${pid}`);
        }
        console.log(`Successfully killed process ${pid}`);
        killedCount++;
      } catch (killError) {
        console.error(`Failed to kill process ${pid}: ${killError.message}`);
      }
    }
    
    return killedCount;
  } catch (error) {
    if (error.status === 1) {
      console.log(`No process found using port ${port}`);
      return 0;
    } else {
      console.error(`Error finding or killing process on port ${port}: ${error.message}`);
      return 0;
    }
  }
}

function getNodeProcesses() {
  try {
    console.log('Looking for Node.js processes that might be related to the socket server...');
    
    let command;
    if (os.platform() === 'win32') {
      command = 'tasklist /FI "IMAGENAME eq node.exe" /FO CSV';
    } else {
      command = 'ps aux | grep node | grep -v grep';
    }
    
    const output = execSync(command, { encoding: 'utf8' });
    console.log('Node.js processes:');
    console.log(output);
  } catch (error) {
    console.error(`Error listing Node.js processes: ${error.message}`);
  }
}

// Main function
function main() {
  console.log('Socket Process Killer');
  console.log('====================');
  console.log(`Checking for processes on port ${PORT} and related ports...`);
  
  // Kill processes on the main port
  const killedCount = findAndKillProcess(PORT);
  
  // Also check additional ports that might be used
  let additionalKilledCount = 0;
  for (const port of ADDITIONAL_PORTS) {
    additionalKilledCount += findAndKillProcess(port);
  }
  
  // Show a summary
  console.log('\nSummary:');
  console.log(`- Killed ${killedCount} process(es) on port ${PORT}`);
  console.log(`- Killed ${additionalKilledCount} process(es) on additional ports`);
  
  if (killedCount === 0 && additionalKilledCount === 0) {
    console.log('\nNo socket server processes were found to kill.');
    console.log('If you are still experiencing issues, here are some additional steps:');
    console.log('1. Restart your development server: npm run dev');
    console.log('2. Check for other Node.js processes that might be related:');
    getNodeProcesses();
    console.log('3. Restart your computer if the issue persists');
  } else {
    console.log('\nSocket server processes have been killed successfully.');
    console.log('You can now restart your development server: npm run dev');
  }
}

main(); 