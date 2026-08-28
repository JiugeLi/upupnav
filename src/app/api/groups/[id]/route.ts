import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { groups } from '@/db/schema';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/get-current-user';

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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 本地开发模式 - 返回模拟数据
    if (isLocalDev) {
      const { id } = await params;
      const body = await req.json() as { name: string; icon: string; sort_order: number };
      return NextResponse.json({
        id: parseInt(id),
        user_id: 1,
        name: body.name,
        icon: body.icon || '📁',
        sort_order: body.sort_order || 0,
        created_at: new Date(),
      });
    }

    const { id } = await params;
    const { env } = getCloudflareContext();
    const db = createDb(env.DB);

    // 获取当前用户 ID
    const userId = getCurrentUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as { name: string; icon: string; sort_order: number };
    const { name, icon, sort_order } = body;

    if (!id) {
      return new NextResponse('Group ID is required', { status: 400 });
    }

    // 只能更新自己的分组
    const result = await db.update(groups)
        .set({
            name,
            icon,
            sort_order,
        })
        .where(and(
          eq(groups.id, parseInt(id)),
          eq(groups.user_id, userId)
        ))
        .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('[GROUP_PUT]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 本地开发模式 - 返回成功
    if (isLocalDev) {
      const { id } = await params;
      return NextResponse.json({ message: 'Group deleted' });
    }

    const { id } = await params;
    const { env } = getCloudflareContext();
    const db = createDb(env.DB);

    // 获取当前用户 ID
    const userId = getCurrentUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return new NextResponse('Group ID is required', { status: 400 });
    }

    // 只能删除自己的分组
    await db.delete(groups).where(and(
      eq(groups.id, parseInt(id)),
      eq(groups.user_id, userId)
    ));

    return NextResponse.json({ message: 'Group deleted' });
  } catch (error) {
    console.error('[GROUP_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
