import { NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { password } = await req.json() as { password: string };
    
    if (!password) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const valid = await verifyPassword(password);
    
    return NextResponse.json({ valid });
  } catch (error) {
    console.error('[AUTH_VERIFY]', error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
