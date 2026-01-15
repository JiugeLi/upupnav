// 从请求中获取当前用户 ID

import { NextRequest } from 'next/server';

/**
 * 从请求头中获取当前用户 ID
 * 前端需要在请求头中添加 X-User-Id
 */
export function getCurrentUserId(req: Request | NextRequest): number | null {
  const userId = req.headers.get('X-User-Id');
  if (!userId) return null;
  
  const parsed = parseInt(userId, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * 检查是否是管理员
 * 管理员通过密码登录，user_id 为 null 或特殊标识
 */
export function isAdmin(req: Request | NextRequest): boolean {
  const isAdminHeader = req.headers.get('X-Is-Admin');
  return isAdminHeader === 'true';
}
