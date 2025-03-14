import { NextRequest, NextResponse } from 'next/server';
import { getSocketServerPort, initServer, getSocketServerStatus } from '@/lib/socket/server-init';

export const dynamic = 'force-dynamic';

// Store active fallback sessions
const fallbackSessions: Record<string, { 
  lastPing: number, 
  messages: Array<{ event: string, data: any }> 
}> = {};

// Clean up old sessions periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(fallbackSessions).forEach(sid => {
    if (now - fallbackSessions[sid].lastPing > 60000) { // 1 minute timeout
      delete fallbackSessions[sid];
    }
  });
}, 30000); // Run every 30 seconds

/**
 * This route acts as a proxy for the socket.io server.
 * In development, it redirects requests to the actual socket server running on a different port.
 * When the socket server is not available, it provides a fallback implementation.
 */
export async function GET(request: NextRequest) {
  try {
    // Try to initialize the socket server if it's not already running
    try {
      await initServer();
    } catch (initError) {
      console.error('Failed to initialize socket server:', initError);
    }
    
    // Get the socket server port
    const port = getSocketServerPort();
    const status = getSocketServerStatus();
    
    // Get request details
    const searchParams = request.nextUrl.searchParams;
    const sid = searchParams.get('sid');
    const transport = searchParams.get('transport');
    const eio = searchParams.get('EIO') || '4';
    
    // If socket server is not available, use fallback mode
    if (!port || !status.initialized) {
      console.log('Socket server not available, using fallback mode');
      
      // Handle polling requests
      if (transport === 'polling') {
        // Initial handshake request (no sid)
        if (!sid) {
          // Generate a unique session ID for the client
          const sessionId = `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
          
          // Create a new session
          fallbackSessions[sessionId] = {
            lastPing: Date.now(),
            messages: [{ 
              event: 'welcome', 
              data: { message: 'Connected to fallback socket server' } 
            }]
          };
          
          // Return a Socket.IO handshake response
          const response = `0{"sid":"${sessionId}","upgrades":[],"pingInterval":25000,"pingTimeout":20000,"maxPayload":1000000}`;
          
          return new NextResponse(response, { 
            status: 200,
            headers: {
              'Content-Type': 'text/plain',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            }
          });
        } 
        // Subsequent polling requests with an existing sid
        else if (fallbackSessions[sid]) {
          // Update last ping time
          fallbackSessions[sid].lastPing = Date.now();
          
          // For GET requests, check if there are any messages to send
          if (request.method === 'GET') {
            const session = fallbackSessions[sid];
            
            if (session.messages.length > 0) {
              // Format messages according to Socket.IO protocol
              const messages = session.messages.map(msg => {
                return `42["${msg.event}",${JSON.stringify(msg.data)}]`;
              }).join('');
              
              // Clear the messages queue
              session.messages = [];
              
              return new NextResponse(messages, { 
                status: 200,
                headers: {
                  'Content-Type': 'text/plain',
                  'Access-Control-Allow-Origin': '*',
                  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                }
              });
            }
            
            // If no messages, send a NOOP packet (ping)
            return new NextResponse('2', { 
              status: 200,
              headers: {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              }
            });
          }
        } 
        // Unknown session
        else {
          return new NextResponse('Invalid session', { 
            status: 400,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
          });
        }
      }
      
      // For non-polling requests in fallback mode
      return new NextResponse('Socket server not available, use polling transport', { 
        status: 503,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }
    
    // If socket server is available, proxy to it
    // Get the hostname from the request
    const hostname = request.headers.get('host')?.split(':')[0] || 'localhost';
    
    // Create the target URL for the socket server
    const targetUrl = `http://${hostname}:${port}${request.nextUrl.pathname}${request.nextUrl.search}`;
    
    console.log(`Socket proxy: Redirecting to ${targetUrl}`);
    
    // Return a redirect response
    return NextResponse.redirect(targetUrl, 307);
  } catch (error) {
    console.error('Error in socket proxy route:', error);
    return new NextResponse('Internal Server Error', { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }
}

// Handle POST requests (client sending data)
export async function POST(request: NextRequest) {
  try {
    // Get the socket server status
    const port = getSocketServerPort();
    const status = getSocketServerStatus();
    
    // Get request details
    const searchParams = request.nextUrl.searchParams;
    const sid = searchParams.get('sid');
    const transport = searchParams.get('transport');
    
    // If socket server is not available and this is a polling request with a valid session
    if ((!port || !status.initialized) && transport === 'polling' && sid && fallbackSessions[sid]) {
      // Update last ping time
      fallbackSessions[sid].lastPing = Date.now();
      
      try {
        // Try to parse the message from the client
        const body = await request.text();
        
        // Socket.IO message format: 42["event_name",{"data":"value"}]
        const messageMatch = body.match(/^42\["([^"]+)",(.+)\]$/);
        if (messageMatch) {
          const event = messageMatch[1];
          const data = JSON.parse(messageMatch[2]);
          
          console.log(`Fallback received message: ${event}`, data);
          
          // Handle test_message event
          if (event === 'test_message') {
            // Add a response message to the session
            fallbackSessions[sid].messages.push({
              event: 'test_response',
              data: {
                message: `Fallback server received: ${data.text}`,
                timestamp: new Date().toISOString()
              }
            });
          }
        }
      } catch (parseError) {
        console.error('Error parsing client message:', parseError);
      }
      
      // Acknowledge the message
      return new NextResponse('40', { 
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        }
      });
    }
    
    // If socket server is available, proxy to it
    return GET(request);
  } catch (error) {
    console.error('Error in socket proxy route (POST):', error);
    return new NextResponse('Internal Server Error', { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Handle other methods
export async function PUT(request: NextRequest) { return GET(request); }
export async function DELETE(request: NextRequest) { return GET(request); }
export async function PATCH(request: NextRequest) { return GET(request); }
export async function HEAD(request: NextRequest) { return GET(request); }

// Disable response caching
export const fetchCache = "force-no-store";
export const revalidate = 0; 