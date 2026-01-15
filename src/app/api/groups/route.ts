import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { groups } from '@/db/schema';
import { NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/get-current-user';

export async function GET(req: Request) {
  try {
    const { env } = getCloudflareContext();
    if (!env?.DB) {
        // Fallback for local development if env is not ready immediately
        return NextResponse.json([]); 
    }
    const db = createDb(env.DB);
    
    // 获取当前用户 ID
    const userId = getCurrentUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const result = await db.select({
        id: groups.id,
        name: groups.name,
        icon: groups.icon,
        sort_order: groups.sort_order,
        created_at: groups.created_at,
    }).from(groups)
      .where(eq(groups.user_id, userId))
      .orderBy(asc(groups.sort_order));
    
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[GROUPS_GET]', error);
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
    
    const body = await req.json() as { name: string; icon: string; sort_order: number };
    const { name, icon, sort_order } = body;

    if (!name) {
      return new NextResponse('Name is required', { status: 400 });
    }

    const result = await db.insert(groups).values({
        user_id: userId,
        name,
        icon: icon || '📁',
        sort_order: sort_order || 0,
    }).returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('[GROUPS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
