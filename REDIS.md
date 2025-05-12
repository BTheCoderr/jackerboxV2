# Using Upstash Redis with JackerBox

This guide explains how JackerBox uses Upstash Redis for persistent data storage and real-time features.

## What is Upstash Redis?

[Upstash Redis](https://upstash.com/) is a serverless Redis service that provides:

- Persistent data storage
- Low-latency key-value operations
- Pub/Sub messaging for real-time communications
- REST API access for serverless environments
- WebSocket support through Redis adapters

## How JackerBox Uses Redis

JackerBox uses Upstash Redis for several key features:

1. **Session Storage**: User sessions are stored in Redis for persistence across serverless functions
2. **Caching**: Frequently accessed data is cached to improve performance
3. **Real-time Messaging**: Chat and notification features use Redis pub/sub
4. **Socket.IO Scaling**: Redis adapter enables WebSocket connections across multiple instances

## Redis Configuration

The Redis connection is configured in `src/lib/redis.ts` and uses the following environment variables:

- `KV_URL`: The Redis connection URL
- `KV_REST_API_TOKEN`: The token for the REST API
- `KV_REST_API_READ_ONLY_TOKEN`: The read-only token for the REST API
- `KV_REST_API_URL`: The URL for the REST API

## Using Redis in Your Code

### Basic Operations

```typescript
import { redis } from '@/lib/redis';

// Store a value
await redis.set('key', 'value');

// Get a value
const value = await redis.get('key');

// Delete a value
await redis.del('key');

// Store with expiration (in seconds)
await redis.set('key', 'value', { ex: 60 }); // Expires in 60 seconds
```

### JSON Objects

```typescript
import { redis } from '@/lib/redis';

// Store a JSON object
await redis.set('user:123', JSON.stringify({ name: 'John', email: 'john@example.com' }));

// Retrieve and parse a JSON object
const userJson = await redis.get('user:123');
const user = JSON.parse(userJson);
```

### Lists

```typescript
import { redis } from '@/lib/redis';

// Add to a list
await redis.lpush('messages', 'Hello');
await redis.lpush('messages', 'World');

// Get list length
const length = await redis.llen('messages');

// Get list items
const messages = await redis.lrange('messages', 0, -1);
```

## WebSocket Integration

JackerBox uses the Redis adapter for Socket.IO to enable WebSocket connections across multiple serverless instances:

```typescript
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redis } from '@/lib/redis';

// Create pub/sub clients
const pubClient = redis;
const subClient = redis.duplicate();

// Create Socket.IO server with Redis adapter
const io = new Server();
io.adapter(createAdapter(pubClient, subClient));
```

## Testing Redis Connection

You can test your Redis connection by visiting:

```
http://localhost:3001/api/redis-test
```

This endpoint will set a test value in Redis and retrieve it to verify the connection.

## Deployment

When deploying to Vercel, ensure you set up the Upstash Redis environment variables:

1. Run the deployment script: `./deploy-to-vercel.sh`
2. Follow the prompts to set up the Redis environment variables
3. After deployment, test the Redis connection at `/api/redis-test`

## Troubleshooting

If you encounter Redis connection issues:

1. Check that the environment variables are correctly set
2. Verify that the Redis instance is running and accessible
3. Check the logs for any connection errors
4. Try using the Redis CLI to connect directly to the Redis instance

For more information about Upstash Redis, visit [upstash.com](https://upstash.com/docs/redis/overall/getstarted). 