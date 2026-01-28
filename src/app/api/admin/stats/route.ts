import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { websites, users, groups } from '@/db/schema';
import { NextResponse } from 'next/server';
import { count, sql } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/get-current-user';

export async function GET(req: Request) {
  try {
    const { env } = getCloudflareContext();
    if (!env?.DB) {
      return new NextResponse('Database not available', { status: 503 });
    }
    const db = createDb(env.DB);

    // Check if admin
    const session = await getCurrentUserId(req);
    // TODO: Add proper admin check

    // Get total users
    const totalUsersResult = await db.select({ count: count() }).from(users);
    const totalUsers = totalUsersResult[0]?.count || 0;

    // Get total links
    const totalLinksResult = await db.select({ count: count() }).from(websites);
    const totalLinks = totalLinksResult[0]?.count || 0;

    // Get total groups
    const totalGroupsResult = await db.select({ count: count() }).from(groups);
    const totalGroups = totalGroupsResult[0]?.count || 0;

    // Get total clicks
    const totalClicksResult = await db.select({ total: sql<number>`COALESCE(SUM(${websites.click_count}), 0)` })
      .from(websites);
    const totalClicks = totalClicksResult[0]?.total || 0;

    // Get new users this week
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersResult = await db.select({ count: count() })
      .from(users)
      .where(sql`${users.created_at} >= ${sevenDaysAgo.toISOString()}`);
    const newUsersThisWeek = newUsersResult[0]?.count || 0;

    // Get new links this week
    const newLinksResult = await db.select({ count: count() })
      .from(websites)
      .where(sql`${websites.created_at} >= ${sevenDaysAgo.toISOString()}`);
    const newLinksThisWeek = newLinksResult[0]?.count || 0;

    return NextResponse.json({
      totalUsers,
      totalLinks,
      totalGroups,
      totalClicks,
      newUsersThisWeek,
      newLinksThisWeek,
    });
  } catch (error) {
    console.error('[ADMIN_STATS]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
