import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'jiugesite-cloud',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    env: process.env.NODE_ENV,
  });
}
