import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { websites } from '@/db/schema';
import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { env } = getCloudflareContext();
    const db = createDb(env.DB);
    if (!id) {
      return new NextResponse('Website ID is required', { status: 400 });
    }

    const result = await db.update(websites)
        .set({
            click_count: sql`${websites.click_count} + 1`,
            last_clicked_at: new Date(),
        })
        .where(eq(websites.id, parseInt(id)))
        .returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('[WEBSITE_CLICK]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
