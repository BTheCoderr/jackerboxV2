// Start both Next.js dev server and socket server
import { spawn } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const NEXT_PORT = process.env.PORT || 3000;
const SOCKET_PORT = process.env.SOCKET_SERVER_PORT || 3002;

console.log('Starting Jackerbox development servers...');
console.log(`Next.js server will run on port ${NEXT_PORT}`);
console.log(`Socket server will run on port ${SOCKET_PORT}`);

// Format stdout/stderr output with prefixes
function formatOutput(prefix, data) {
  return data
    .toString()
    .trim()
    .split('\n')
    .map(line => `${prefix} ${line}`)
    .join('\n');
}

// Start Next.js dev server
const nextServer = spawn('npm', ['run', 'dev'], {
  stdio: 'pipe',
  shell: true,
  env: {
    ...process.env,
    PORT: NEXT_PORT
  }
});

nextServer.stdout.on('data', (data) => {
  console.log(formatOutput('[next]', data));
});

nextServer.stderr.on('data', (data) => {
  console.error(formatOutput('[next]', data));
});

nextServer.on('close', (code) => {
  console.log(`Next.js dev server exited with code ${code}`);
  process.exit(code);
});

// Start socket server
const socketServer = spawn('node', ['scripts/socket-server.js'], {
  stdio: 'pipe',
  shell: true,
  env: {
    ...process.env,
    SOCKET_SERVER_PORT: SOCKET_PORT
  }
});

socketServer.stdout.on('data', (data) => {
  console.log(formatOutput('[socket]', data));
});

socketServer.stderr.on('data', (data) => {
  console.error(formatOutput('[socket]', data));
});

socketServer.on('close', (code) => {
  console.log(`Socket.IO server exited with code ${code}`);
  if (code !== 0) {
    console.error('Socket server crashed, consider restarting');
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down all servers...');
  
  // Kill child processes
  nextServer.kill('SIGINT');
  socketServer.kill('SIGINT');
  
  // Exit after a timeout
  setTimeout(() => {
    console.log('Forcing exit...');
    process.exit(0);
  }, 500);
});

console.log('\nBoth servers are starting up.');
console.log('Press Ctrl+C to stop all servers.'); 