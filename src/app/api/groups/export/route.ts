import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { groups, websites } from '@/db/schema';
import { NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/get-current-user';

export async function GET(req: Request) {
  try {
    const { env } = getCloudflareContext();
    const db = createDb(env.DB);
    
    // Get current user ID
    const userId = getCurrentUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Export only the current user's data
    const userGroups = await db
      .select()
      .from(groups)
      .where(eq(groups.user_id, userId))
      .orderBy(asc(groups.sort_order));
      
    const userWebsites = await db
      .select()
      .from(websites)
      .where(eq(websites.user_id, userId))
      .orderBy(asc(websites.sort_order));

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        groups: userGroups,
        websites: userWebsites,
      },
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('[EXPORT_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
