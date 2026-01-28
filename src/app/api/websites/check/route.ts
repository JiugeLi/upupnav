import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { websites } from '@/db/schema';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/get-current-user';

interface CheckResult {
  id: number;
  name: string;
  url: string;
  status: 'ok' | 'error' | 'timeout';
  statusCode?: number;
  error?: string;
}

async function checkLink(url: string): Promise<CheckResult> {
  const timeout = 5000; // 5 seconds timeout per link (reduced for faster checking)

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; jiugeNav LinkChecker)',
      },
    }).catch(async (err) => {
      // If HEAD fails, try GET
      if (err.name === 'AbortError') {
        throw new Error('Timeout');
      }
      return fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; jiugeNav LinkChecker)',
        },
      });
    });

    clearTimeout(timeoutId);

    const statusCode = response.status;
    const statusOk = statusCode >= 200 && statusCode < 400;

    return {
      id: 0,
      name: '',
      url,
      status: statusOk ? 'ok' : 'error',
      statusCode,
    };
  } catch (error: any) {
    return {
      id: 0,
      name: '',
      url,
      status: error?.message === 'Timeout' ? 'timeout' : 'error',
      error: error?.message || 'Unknown error',
    };
  }
}

// GET - Check all links (progressive checking)
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

    // Get query params for batch checking
    const url = new URL(req.url);
    const batchIndex = parseInt(url.searchParams.get('batch') || '0');
    const batchSize = 10; // Check 10 links per batch

    // Get all websites for this user
    const allWebsites = await db.select().from(websites)
      .where(eq(websites.user_id, userId));

    // Calculate batch range
    const start = batchIndex * batchSize;
    const end = Math.min(start + batchSize, allWebsites.length);
    const isLastBatch = end >= allWebsites.length;

    // Check links in this batch (in parallel for speed)
    const batchPromises = [];
    for (let i = start; i < end; i++) {
      const site = allWebsites[i];
      batchPromises.push(
        checkLink(site.url).then(result => ({
          ...result,
          id: site.id,
          name: site.name,
          url: site.url,
        }))
      );
    }

    const batchResults = await Promise.all(batchPromises);

    return NextResponse.json({
      total: allWebsites.length,
      batchIndex,
      batchSize,
      isLastBatch,
      results: batchResults,
      progress: isLastBatch ? 100 : Math.round(((batchIndex + 1) * batchSize / allWebsites.length) * 100),
    });
  } catch (error) {
    console.error('[WEBSITES_CHECK]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// DELETE - Bulk delete bad links
export async function DELETE(req: Request) {
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

    const body = await req.json() as { ids: number[] };
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return new NextResponse('Invalid request', { status: 400 });
    }

    // Delete the websites using a loop for safety
    for (const id of ids) {
      await db.delete(websites)
        .where(and(eq(websites.id, id), eq(websites.user_id, userId)));
    }

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error('[WEBSITES_CHECK_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
