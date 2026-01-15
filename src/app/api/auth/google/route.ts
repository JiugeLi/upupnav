import { NextResponse } from 'next/server';
import { verifyGoogleToken } from '@/lib/google-auth';
import { loginOrCreateUserWithGoogle } from '@/lib/user-auth';

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json() as { idToken: string };
    
    if (!idToken) {
      return NextResponse.json({ 
        success: false,
        message: 'ID Token is required' 
      }, { status: 400 });
    }

    // 验证 Google Token
    const googleInfo = await verifyGoogleToken(idToken);
    
    if (!googleInfo) {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid Google token' 
      }, { status: 401 });
    }

    // 登录或创建用户
    const userSession = await loginOrCreateUserWithGoogle(googleInfo);
    
    if (!userSession) {
      return NextResponse.json({ 
        success: false,
        message: 'Failed to create user session' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      user: userSession
    });
    
  } catch (error) {
    console.error('[GOOGLE_AUTH]', error);
    return NextResponse.json({ 
      success: false,
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
