import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { websites } from '@/db/schema';
import { NextResponse } from 'next/server';
import { eq, count, and, gte, sql } from 'drizzle-orm';
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

export async function GET(req: Request) {
  try {
    // 本地开发模式 - 返回默认数据
    if (isLocalDev) {
      return NextResponse.json({
        totalLinks: 0,
        totalClicks: 0,
        weeklyClicks: 0,
        newLinksThisWeek: 0,
      });
    }

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
    const sevenDaysAgoTimestamp = Math.floor(sevenDaysAgo.getTime() / 1000); // Convert to Unix timestamp

    // Get total links count
    const totalLinksResult = await db.select({ count: count() })
      .from(websites)
      .where(eq(websites.user_id, userId));
    const totalLinks = totalLinksResult[0]?.count || 0;

    // Get total click count by summing all click_count values
    const websitesData = await db.select({ click_count: websites.click_count }).from(websites).where(eq(websites.user_id, userId));
    const totalClicks = websitesData.reduce((sum: number, w: { click_count: number | null }) => sum + (w.click_count || 0), 0);

    // Get clicks from this week - sum click_count for websites clicked in last 7 days
    // Use sql for timestamp comparison since fields are stored as integers
    const weeklyWebsites = await db.select({
      click_count: websites.click_count
    })
      .from(websites)
      .where(
        sql`${websites.user_id} = ${userId} AND ${websites.last_clicked_at} >= ${sevenDaysAgoTimestamp}`
      );
    const weeklyClicks = weeklyWebsites.reduce((sum: number, w: { click_count: number | null }) => sum + (w.click_count || 0), 0);

    // Get new links added this week
    const newLinksThisWeekResult = await db.select({ id: websites.id })
      .from(websites)
      .where(
        sql`${websites.user_id} = ${userId} AND ${websites.created_at} >= ${sevenDaysAgoTimestamp}`
      );
    const newLinksThisWeek = newLinksThisWeekResult.length || 0;

    return NextResponse.json({
      totalLinks,
      totalClicks,
      weeklyClicks,
      newLinksThisWeek,
    });
  } catch (error) {
    console.error('[STATS_GET]', error);
    // 如果在本地开发模式，返回默认数据而不是错误
    if (isLocalDev) {
      return NextResponse.json({
        totalLinks: 0,
        totalClicks: 0,
        weeklyClicks: 0,
        newLinksThisWeek: 0,
      });
    }
    return new NextResponse('Internal Error', { status: 500 });
  }
}
