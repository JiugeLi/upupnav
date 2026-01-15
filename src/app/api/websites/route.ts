import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { websites } from '@/db/schema';
import { NextResponse } from 'next/server';
import { desc, asc, eq } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/get-current-user';

export async function GET(req: Request) {
  try {
    const { env } = getCloudflareContext();
    if (!env?.DB) {
       return new NextResponse('Database not available', { status: 503 });
    }
    const db = createDb(env.DB);
    
    // 获取当前用户 ID
    const userId = getCurrentUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const result = await db.select().from(websites)
      .where(eq(websites.user_id, userId))
      .orderBy(
        asc(websites.group_id),
        desc(websites.click_count),
        asc(websites.sort_order)
      );
    
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[WEBSITES_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
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
    
    const body = await req.json() as {
        group_id: string;
        name: string;
        url: string;
        logo_url: string;
        logo_type: string;
        description: string;
        username?: string;
        password?: string;
        sort_order: number;
    };
    const {
      group_id,
      name,
      url,
      logo_url,
      logo_type,
      description,
      username,
      password,
      sort_order,
    } = body;

    if (!group_id || !name || !url) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const result = await db.insert(websites).values({
        user_id: userId,
        group_id: parseInt(group_id),
        name,
        url,
        logo_url,
        logo_type: logo_type || 'default',
        description,
        username,
        password,
        sort_order: sort_order || 0,
    }).returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('[WEBSITES_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
