# Socket Server Implementation

This document explains how the socket server is implemented in the Jackerbox application and how to troubleshoot common issues.

## Overview

The application uses Socket.IO for real-time communication between the client and server. The socket server is implemented in a way that works with Next.js App Router, which requires some special handling.

## Implementation Details

The socket server is implemented in several main files:

1. `src/lib/socket/server-init.ts`: This file contains the core implementation of the socket server, including:
   - Creating an HTTP server for Socket.IO
   - Configuring Socket.IO options
   - Setting up authentication middleware
   - Finding an available port for the socket server
   - Handling errors and retries
   - Managing the global socket server state

2. `src/app/api/socket-init.ts`: This file ensures the socket server is initialized when the application starts up in development mode.

3. `src/app/api/socket/route.ts`: This file creates a proxy route that redirects WebSocket connections from the Next.js server (port 3000) to the socket server (port 3001).

4. `src/hooks/use-socket.ts`: This client-side hook manages the socket connection, including:
   - Connecting to the socket server
   - Handling reconnection attempts
   - Trying multiple ports if the primary port is unavailable
   - Falling back to polling mode if WebSocket connections fail
   - Providing methods for sending and receiving messages

5. `src/components/messaging/socket-status.tsx`: This component displays the current socket connection status.

6. `src/app/api/socket-status/route.ts`: This API endpoint provides information about the socket server status.

7. `src/app/routes/debug/socket/page.tsx`: This page provides a debug interface for the socket server.

## How It Works

1. When the application starts up in development mode, the socket server is initialized.
2. The socket server tries to listen on port 3001 by default.
3. If port 3001 is already in use, the server will try to find an available port from a list of alternatives (3002, 3003, 3004, 3005).
4. If an available port is found, the server will listen on that port.
5. If no available port is found, the socket server will fall back to polling mode.
6. The client-side socket hook will attempt to connect directly to the socket server on its port (e.g., 3001).
7. If the client cannot connect to any port, it will fall back to polling mode.
8. The proxy route at `/api/socket` redirects requests from the Next.js server (port 3000) to the socket server (port 3001).

## Connection Flow

1. The client connects to `http://localhost:3000/api/socket` (Next.js server).
2. The proxy route redirects the request to `http://localhost:3001/api/socket` (Socket.IO server).
3. The Socket.IO server handles the connection and upgrades it to a WebSocket if possible.
4. If WebSocket is not available, the connection falls back to polling.

## Common Issues

### EADDRINUSE Error

The most common issue is the "EADDRINUSE" error, which occurs when the socket server tries to listen on a port that is already in use. This can happen if:

- A previous instance of the application is still running
- Another application is using the same port
- The socket server process was not properly terminated

### How to Fix EADDRINUSE Error

1. Run the `kill-socket` script to kill any processes using port 3001 and related ports:

```bash
npm run kill-socket
```

2. Restart the development server:

```bash
npm run dev
```

### WebSocket Connection Failures

If you see errors like `WebSocket connection to 'ws://localhost:3000/api/socket/?EIO=4&transport=websocket' failed`, it could be due to:

- The socket server is not running
- The proxy route is not working correctly
- The client is not authenticated
- The socket server is in polling mode due to port conflicts

### How to Fix WebSocket Connection Failures

1. Check the socket server status using the API endpoint:

```bash
curl http://localhost:3000/api/socket-status
```

2. Make sure the socket server is running on the expected port:

```bash
lsof -i :3001
```

3. Check if the proxy route is working correctly:

```bash
curl -v http://localhost:3000/api/socket
```

4. If the socket server is not running, try restarting the application and running the `kill-socket` script first.

5. Use the socket status component with debug mode enabled to see more information:

```jsx
<SocketStatus showDebugInfo={true} />
```

6. Visit the socket debug page at `/routes/debug/socket` to see detailed information about the socket connection.

## Advanced Troubleshooting

### Finding Socket Server Processes

To find all processes using port 3001:

```bash
# On macOS/Linux
lsof -i :3001

# On Windows
netstat -ano | findstr :3001
```

### Manually Killing Socket Server Processes

To manually kill a process using port 3001:

```bash
# On macOS/Linux
kill -9 <PID>

# On Windows
taskkill /F /PID <PID>
```

### Checking Socket Server Status

To check the socket server status:

```bash
curl http://localhost:3000/api/socket-status
```

### Resetting the Socket Connection

If you're experiencing issues with the socket connection, you can reset it using the reset button in the socket status component (when debug mode is enabled):

```jsx
<SocketStatus showDebugInfo={true} />
```

## Socket Server Configuration

The socket server is configured with the following options:

```javascript
{
  path: '/api/socket',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingInterval: 60000, // 60 seconds
  pingTimeout: 30000,  // 30 seconds
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
  upgradeTimeout: 10000,
}
```

These options can be adjusted in `src/lib/socket/server-init.ts` if needed.

## Client-Side Socket Configuration

The client-side socket is configured with the following options:

```javascript
{
  path: "/api/socket",
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ["websocket"],
  withCredentials: true,
  timeout: 10000,
  pingInterval: 60000,
  pingTimeout: 30000,
  forceNew: true,
}
```

These options can be adjusted in `src/hooks/use-socket.ts` if needed. 