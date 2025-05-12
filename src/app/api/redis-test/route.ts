import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function GET() {
  try {
    // Set a test value
    await redis.set('test-key', 'Redis connection working!');
    
    // Get the test value
    const value = await redis.get('test-key');
    
    // Return success response
    return NextResponse.json({ 
      status: 'success', 
      message: 'Redis connection successful',
      value 
    }, { status: 200 });
  } catch (error) {
    console.error('Redis test error:', error);
    
    // Return error response
    return NextResponse.json({ 
      status: 'error', 
      message: 'Redis connection failed',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, value } = body;
    
    if (!key || !value) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Missing key or value in request body' 
      }, { status: 400 });
    }
    
    // Store the value in Redis
    await redis.set(key, value);
    
    // Return success response
    return NextResponse.json({ 
      status: 'success', 
      message: `Value stored successfully under key: ${key}`
    }, { status: 200 });
  } catch (error) {
    console.error('Redis store error:', error);
    
    // Return error response
    return NextResponse.json({ 
      status: 'error', 
      message: 'Failed to store value in Redis',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 