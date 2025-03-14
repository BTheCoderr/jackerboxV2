import { NextRequest, NextResponse } from 'next/server';
import { ImageResponse } from 'next/og';
import React from 'react';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const width = parseInt(searchParams.get('width') || '1200');
    const height = parseInt(searchParams.get('height') || '630');
    const title = searchParams.get('title') || 'Jackerbox';
    
    // Create a dynamic splash screen
    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#0f172a',
            color: 'white',
            fontFamily: 'sans-serif',
            padding: '40px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              marginBottom: '10px',
              textAlign: 'center',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: '24px',
              opacity: 0.8,
              textAlign: 'center',
            }}
          >
            Peer-to-Peer Equipment Rental
          </div>
        </div>
      ),
      {
        width,
        height,
      }
    );

    return imageResponse;
  } catch (error) {
    console.error('Error generating splash screen:', error);
    return NextResponse.json(
      { error: 'Failed to generate splash screen' },
      { status: 500 }
    );
  }
} 