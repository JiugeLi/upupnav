import { NextResponse } from 'next/server';

// 注意：这个功能只能在生产环境使用 Cloudflare Workers 的环境变量
// 本地开发环境无法修改密码（密码硬编码在代码中）
export async function POST(req: Request) {
  try {
    const { newPassword } = await req.json() as { newPassword: string };
    
    if (!newPassword || newPassword.length < 6) {
      return new NextResponse('密码长度至少 6 位', { status: 400 });
    }

    // 在 Cloudflare Workers 环境中，密码存储在环境变量中
    // 本地开发环境无法修改（使用硬编码的默认密码）
    
    return NextResponse.json({ 
      success: false,
      message: '密码修改功能仅在生产环境可用。请使用 Cloudflare Dashboard 或 wrangler secret put ADMIN_PASSWORD 命令修改密码。'
    });
    
  } catch (error) {
    console.error('[CHANGE_PASSWORD]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
