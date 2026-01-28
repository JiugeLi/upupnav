import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { websites } from '@/db/schema';
import { NextResponse } from 'next/server';
import { eq, count, gte, sql } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/get-current-user';

export async function GET(req: Request) {
  try {
    const { env } = getCloudflareContext();
    if (!env?.DB) {
      return new NextResponse('Database not available', { status: 503 });
    }
    const db = createDb(env.DB);

    // Get current user ID
    const userId = getCurrentUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate the date for 7 days ago (this week)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString();

    // Get total links count
    const totalLinksResult = await db.select({ count: count() })
      .from(websites)
      .where(eq(websites.user_id, userId));
    const totalLinks = totalLinksResult[0]?.count || 0;

    // Get total click count
    const totalClicksResult = await db.select({ total: sql<number>`COALESCE(SUM(${websites.click_count}), 0)` })
      .from(websites)
      .where(eq(websites.user_id, userId));
    const totalClicks = totalClicksResult[0]?.total || 0;

    // Get clicks from this week (we need to estimate since we don't track per-click timestamps)
    // We'll use the last_clicked_at as a proxy - count websites clicked in last 7 days
    const recentClicksResult = await db.select({ count: count() })
      .from(websites)
      .where(
        eq(websites.user_id, userId)
      );
    // Since we don't have detailed click history, we'll estimate based on click_count
    // For now, return 0 as placeholder for weekly clicks
    const weeklyClicks = 0;

    // Get new links added this week
    const newLinksResult = await db.select({ count: count() })
      .from(websites)
      .where(
        sql`${websites.user_id} = ${userId} AND ${websites.created_at} >= ${sevenDaysAgoStr}`
      );
    const newLinksThisWeek = newLinksResult[0]?.count || 0;

    return NextResponse.json({
      totalLinks,
      totalClicks,
      weeklyClicks,
      newLinksThisWeek,
    });
  } catch (error) {
    console.error('[STATS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
