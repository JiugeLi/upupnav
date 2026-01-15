import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { groups } from '@/db/schema';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { env } = getCloudflareContext();
    const db = createDb(env.DB);
    const body = await req.json() as { name: string; icon: string; sort_order: number };
    const { name, icon, sort_order } = body;

    if (!id) {
      return new NextResponse('Group ID is required', { status: 400 });
    }

    const result = await db.update(groups)
        .set({
            name,
            icon,
            sort_order,
        })
        .where(eq(groups.id, parseInt(id)))
        .returning();

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
    const { id } = await params;
    const { env } = getCloudflareContext();
    const db = createDb(env.DB);

    if (!id) {
      return new NextResponse('Group ID is required', { status: 400 });
    }

    await db.delete(groups).where(eq(groups.id, parseInt(id)));

    return NextResponse.json({ message: 'Group deleted' });
  } catch (error) {
    console.error('[GROUP_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
