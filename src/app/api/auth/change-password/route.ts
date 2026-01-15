import { NextResponse } from 'next/server';
import { changePassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { newPassword } = await req.json() as { newPassword: string };
    
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ 
        success: false,
        message: '密码长度至少 6 位' 
      }, { status: 400 });
    }

    const success = await changePassword(newPassword);
    
    if (success) {
      return NextResponse.json({ 
        success: true,
        message: '密码修改成功' 
      });
    } else {
      return NextResponse.json({ 
        success: false,
        message: '密码修改失败' 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('[CHANGE_PASSWORD]', error);
    return NextResponse.json({ 
      success: false,
      message: '服务器错误' 
    }, { status: 500 });
  }
}
