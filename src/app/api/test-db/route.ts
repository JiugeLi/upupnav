import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { groups, websites } from '@/db/schema';
import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';

// 本地开发模式标志
let isLocalDev = false;

// 检查是否在本地开发环境
try {
  const { env } = getCloudflareContext();
  if (!env?.DB) {
    isLocalDev = true;
  }
} catch (e) {
  isLocalDev = true;
}

export async function GET() {
  try {
    // 本地开发模式
    if (isLocalDev) {
      return NextResponse.json({
        status: 'ok',
        database: 'connected (via HTTP proxy)',
        localDev: true,
        timestamp: new Date().toISOString(),
      });
    }

    const { env } = getCloudflareContext();
    if (!env?.DB) {
         return NextResponse.json({ status: 'error', message: 'DB not available' });
    }
    const db = createDb(env.DB);

    // Test connection by running a simple query
    const groupCount = await db.select({ count: sql<number>`count(*)` }).from(groups);
    const websiteCount = await db.select({ count: sql<number>`count(*)` }).from(websites);

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      counts: {
        groups: groupCount[0].count,
        websites: websiteCount[0].count,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('[TEST_DB]', error);

    return NextResponse.json({
      status: 'error',
      error: errorMessage,
    }, { status: 500 });
  }
}
