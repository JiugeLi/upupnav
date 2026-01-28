import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { users, websites, groups } from '@/db/schema';
import { NextResponse } from 'next/server';
import { eq, count, desc, sql } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/get-current-user';

// GET - Get all users with their stats
export async function GET(req: Request) {
  try {
    const { env } = getCloudflareContext();
    if (!env?.DB) {
      return new NextResponse('Database not available', { status: 503 });
    }
    const db = createDb(env.DB);

    // Get all users
    const allUsers = await db.select().from(users).orderBy(desc(users.created_at));

    // Get stats for each user
    const usersWithStats = await Promise.all(
      allUsers.map(async (user) => {
        const [linksResult, groupsResult] = await Promise.all([
          db.select({ count: count() }).from(websites).where(eq(websites.user_id, user.id)),
          db.select({ count: count() }).from(groups).where(eq(groups.user_id, user.id)),
        ]);

        const totalClicksResult = await db.select({
          total: sql<number>`COALESCE(SUM(${websites.click_count}), 0)`
        }).from(websites).where(eq(websites.user_id, user.id));

        return {
          ...user,
          linkCount: linksResult[0]?.count || 0,
          groupCount: groupsResult[0]?.count || 0,
          totalClicks: totalClicksResult[0]?.total || 0,
        };
      })
    );

    return NextResponse.json(usersWithStats);
  } catch (error) {
    console.error('[ADMIN_USERS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// DELETE - Delete a user and all their data
export async function DELETE(req: Request) {
  try {
    const { env } = getCloudflareContext();
    if (!env?.DB) {
      return new NextResponse('Database not available', { status: 503 });
    }
    const db = createDb(env.DB);

    const body = await req.json() as { id: number };
    const { id } = body;

    if (!id) {
      return new NextResponse('Invalid request', { status: 400 });
    }

    // Delete user (cascade will handle groups and websites)
    await db.delete(users).where(eq(users.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN_USERS_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
