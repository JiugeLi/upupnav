import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { groups, websites } from '@/db/schema';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/get-current-user';

interface ImportData {
    groups: Array<{
        id?: number;
        name: string;
        icon: string;
        sort_order: number;
    }>;
    websites: Array<{
        group_id: number;
        name: string;
        url: string;
        logo_url: string;
        logo_type: string;
        description: string;
        sort_order: number;
    }>;
}

export async function POST(req: Request) {
  try {
    const { env } = getCloudflareContext();
    const db = createDb(env.DB);
    
    // 获取当前用户 ID
    const userId = getCurrentUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json() as { data: ImportData; mode: 'merge' | 'replace' };
    const { data, mode = 'merge' } = body; 

    if (!data || !data.groups || !data.websites) {
      return new NextResponse('Invalid data format', { status: 400 });
    }

    // If replace, delete everything for this user
    if (mode === 'replace') {
      await db.delete(websites).where(eq(websites.user_id, userId));
      await db.delete(groups).where(eq(groups.user_id, userId));
    }

    // Simple import logic
    const groupIdMap: Record<number, number> = {};

    for (const grp of data.groups) {
      const result = await db.insert(groups).values({
          user_id: userId,
          name: grp.name,
          icon: grp.icon,
          sort_order: grp.sort_order,
      }).returning();
      
      if (grp.id) {
          groupIdMap[grp.id] = result[0].id;
      }
    }

    for (const site of data.websites) {
      const newGroupId = groupIdMap[site.group_id];
      
      if (newGroupId) {
        await db.insert(websites).values({
            user_id: userId,
            group_id: newGroupId,
            name: site.name,
            url: site.url,
            logo_url: site.logo_url,
            logo_type: site.logo_type,
            description: site.description,
            sort_order: site.sort_order,
        });
      }
    }

    return NextResponse.json({ message: 'Import successful' });
  } catch (error) {
    console.error('[IMPORT_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
