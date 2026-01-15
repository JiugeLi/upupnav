import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { websites } from '@/db/schema';
import { NextResponse } from 'next/server';
import { eq, sql, and } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/get-current-user';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const result = await db.update(websites)
        .set({
            click_count: sql`${websites.click_count} + 1`,
            last_clicked_at: new Date(),
        })
        .where(and(
          eq(websites.id, parseInt(id)),
          eq(websites.user_id, userId)
        ))
        .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('[WEBSITE_CLICK]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
