# Socket Server Documentation

## Overview

This application uses Socket.IO for real-time communication between clients and the server. The socket server is implemented as a separate HTTP server that runs alongside the Next.js application server. This approach allows for WebSocket connections without interfering with the Next.js server.

## Implementation Details

The socket server implementation is split into two main files:

1. `src/lib/socket/server-init.ts` - Contains the core socket server initialization logic
2. `src/app/api/socket/route.ts` - Provides a proxy route for client connections

### How It Works

1. **Server Initialization**:
   - The socket server is initialized when the Next.js application starts (in development mode).
   - It creates a separate HTTP server on port 3001 (or another available port if 3001 is in use).
   - Socket.IO is attached to this HTTP server with authentication middleware.

2. **Connection Flow**:
   - Clients connect to `/api/socket` on the Next.js server (port 3000).
   - The proxy route redirects the connection to the socket server on port 3001.
   - For WebSocket connections, the client follows the redirect and establishes a direct WebSocket connection.
   - For polling connections, the proxy handles the forwarding.

3. **Port Handling**:
   - The socket server first tries to use port 3001.
   - If port 3001 is in use, it tries ports 3002, 3003, 3004, and 3005.
   - If all ports are in use, it falls back to polling mode.

4. **Fallback Mechanism**:
   - If WebSocket connections fail, the client automatically falls back to HTTP long-polling.
   - This ensures that real-time communication works even in environments where WebSockets are blocked.

## Client-Side Implementation

The client-side socket connection is implemented in the `useSocket` hook (`src/hooks/use-socket.ts`). This hook:

1. Creates a socket connection to the proxy route
2. Manages the connection state
3. Provides methods to connect, disconnect, and handle events
4. Automatically reconnects when the connection is lost

## Common Issues and Solutions

### EADDRINUSE Error

**Problem**: The socket server fails to start because port 3001 (or other ports) is already in use.

**Solution**:
1. The server will automatically try alternative ports (3002-3005).
2. If all ports are in use, you can manually kill the processes using those ports:
   ```
   npm run kill-socket
   ```
3. Restart the development server:
   ```
   npm run dev
   ```

### Socket Connection Issues

**Problem**: Clients cannot connect to the socket server.

**Solution**:
1. Check if the socket server is running by visiting `/api/socket-status`.
2. Ensure the client is connecting to the correct URL (`/api/socket`).
3. Check browser console for connection errors.
4. Try refreshing the page or restarting the development server.

## Debugging

### Socket Status Endpoint

The application provides a status endpoint at `/api/socket-status` that returns information about the socket server:

```json
{
  "initialized": true,
  "initializing": false,
  "port": 3001,
  "error": null,
  "socketServerUrl": "http://localhost:3001",
  "proxyUrl": "http://localhost:3000/api/socket",
  "timestamp": "2023-06-01T12:00:00.000Z"
}
```

### Debug Page

A debug page is available at `/routes/debug/socket` that provides:
- Socket server status information
- Client connection details
- Real-time event logging
- Connection controls

### Socket Status Component

The `SocketStatus` component (`src/components/messaging/socket-status.tsx`) displays the current connection status in the UI and provides controls to connect and disconnect.

## Advanced Troubleshooting

### Finding and Killing Socket Server Processes

To find processes using the socket server ports:

```bash
lsof -i :3001
```

To kill a process using a specific port:

```bash
kill -9 <PID>
```

Or use the provided utility script:

```bash
npm run kill-socket
```

### Checking Logs

Socket server logs are output to the console. Look for messages starting with:
- `Socket.io HTTP server listening on port...`
- `Socket connected: <socket-id>`
- `Socket disconnected: <socket-id>`

## Configuration Options

The socket server can be configured by modifying the options in `src/lib/socket/server-init.ts`:

```typescript
const io = new SocketIOServer(httpServer, {
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
});
```

Client-side options can be modified in `src/hooks/use-socket.ts`:

```typescript
const socketInstance = io({
  path: '/api/socket',
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket', 'polling'],
});
``` 