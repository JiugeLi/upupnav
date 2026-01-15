import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { groups, websites } from '@/db/schema';
import { NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';

export async function GET() {
  try {
    const { env } = getCloudflareContext();
    const db = createDb(env.DB);
    const allGroups = await db.select().from(groups).orderBy(asc(groups.sort_order));
    const allWebsites = await db.select().from(websites).orderBy(asc(websites.sort_order));

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        groups: allGroups,
        websites: allWebsites,
      },
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('[EXPORT_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
