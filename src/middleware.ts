import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 简单的中间件，不再使用 Supabase 认证 (OpenNext 兼容性问题，原代码备份在 middleware.ts.original)
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
