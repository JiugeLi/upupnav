import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { groups } from '@/db/schema';
import { NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/get-current-user';
import { getUserSession } from '@/lib/user-auth';

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

export async function GET(req: Request) {
  try {
    // 本地开发模式 - 返回空数组
    if (isLocalDev) {
      return NextResponse.json([]);
    }

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
    // 本地开发模式 - 返回模拟数据
    if (isLocalDev) {
      const body = await req.json() as { name: string; icon: string; sort_order: number };
      return NextResponse.json({
        id: Math.floor(Math.random() * 1000),
        name: body.name,
        icon: body.icon || '📁',
        sort_order: body.sort_order || 0,
        created_at: new Date(),
      });
    }

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
