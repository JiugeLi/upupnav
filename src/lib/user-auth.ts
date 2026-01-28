// 用户认证工具（支持 Google OAuth 和密码登录）

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { GoogleUserInfo } from './google-auth';

export interface UserSession {
  userId: number;
  email: string;
  name: string | null;
  avatar: string | null;
  isAdmin: boolean;
}

/**
 * 通过 Google 信息登录或注册用户
 * @param googleInfo Google 用户信息
 * @returns 用户会话信息
 */
export async function loginOrCreateUserWithGoogle(googleInfo: GoogleUserInfo): Promise<UserSession | null> {
  try {
    const { env } = getCloudflareContext();
    const db = createDb(env.DB);
    
    // 查找用户
    let user = await db.select().from(users).where(eq(users.google_id, googleInfo.id)).limit(1);
    
    if (user.length === 0) {
      // 用户不存在，创建新用户
      const result = await db.insert(users).values({
        email: googleInfo.email,
        name: googleInfo.name,
        avatar: googleInfo.picture,
        google_id: googleInfo.id,
        last_login: new Date(),
      }).returning();
      
      user = result;
      console.log('[AUTH] New user created:', googleInfo.email);
    } else {
      // 更新最后登录时间
      await db.update(users)
        .set({ last_login: new Date() })
        .where(eq(users.id, user[0].id));
    }
    
    return {
      userId: user[0].id,
      email: user[0].email,
      name: user[0].name,
      avatar: user[0].avatar,
      isAdmin: false, // Google 登录的用户不是管理员
    };
  } catch (error) {
    console.error('[AUTH] Login/Create user failed:', error);
    return null;
  }
}

/**
 * 获取用户信息
 * @param userId 用户 ID
 * @returns 用户信息
 */
export async function getUserById(userId: number): Promise<UserSession | null> {
  try {
    const { env } = getCloudflareContext();
    const db = createDb(env.DB);
    
    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    return {
      userId: result[0].id,
      email: result[0].email,
      name: result[0].name,
      avatar: result[0].avatar,
      isAdmin: false,
    };
  } catch (error) {
    console.error('[AUTH] Get user failed:', error);
    return null;
  }
}

// 客户端会话管理
export const USER_SESSION_KEY = 'jiugenav_user_session';

export function saveUserSession(session: UserSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
}

export function getUserSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(USER_SESSION_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as UserSession;
  } catch {
    return null;
  }
}

export function clearUserSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_SESSION_KEY);
}

export function isUserLoggedIn(): boolean {
  return getUserSession() !== null;
}
