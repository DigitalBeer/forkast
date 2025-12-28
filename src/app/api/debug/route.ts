import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'success',
    message: 'Debug endpoint is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    nextConfig: {
      basePath: process.env.NEXT_PUBLIC_BASE_PATH || 'not set',
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'not set'
    }
  });
}
