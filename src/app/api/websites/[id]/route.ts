import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { websites } from '@/db/schema';
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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 本地开发模式 - 返回模拟数据
    if (isLocalDev) {
      const { id } = await params;
      return NextResponse.json({
        id: parseInt(id),
        user_id: 1,
        group_id: 1,
        name: 'Test Website',
        url: 'https://example.com',
        logo_url: null,
        logo_type: 'default',
        description: 'Test description',
        username: null,
        password: null,
        click_count: 0,
        last_clicked_at: null,
        sort_order: 0,
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

    const result = await db.select().from(websites).where(and(
      eq(websites.id, parseInt(id)),
      eq(websites.user_id, userId)
    ));

    if (!result.length) {
      return new NextResponse('Website not found', { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('[WEBSITE_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 本地开发模式 - 返回模拟数据
    if (isLocalDev) {
      const { id } = await params;
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
      return NextResponse.json({
        id: parseInt(id),
        user_id: 1,
        group_id: parseInt(body.group_id),
        name: body.name,
        url: body.url,
        logo_url: body.logo_url || null,
        logo_type: body.logo_type || 'default',
        description: body.description || null,
        username: body.username || null,
        password: body.password || null,
        click_count: 0,
        last_clicked_at: null,
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

    if (!id) {
        return new NextResponse('Website ID is required', { status: 400 });
    }

    const result = await db.update(websites).set({
        group_id: group_id ? parseInt(group_id) : undefined,
        name,
        url,
        logo_url,
        logo_type,
        description,
        username,
        password,
        sort_order,
    }).where(and(
      eq(websites.id, parseInt(id)),
      eq(websites.user_id, userId)
    )).returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('[WEBSITE_PUT]', error);
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
            return NextResponse.json({ message: 'Website deleted' });
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
            return new NextResponse('Website ID is required', { status: 400 });
        }

        await db.delete(websites).where(and(
          eq(websites.id, parseInt(id)),
          eq(websites.user_id, userId)
        ));

        return NextResponse.json({ message: 'Website deleted' });
    } catch (error) {
        console.error('[WEBSITE_DELETE]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
