import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createDb } from '@/db';
import { admin } from '@/db/schema';
import { verifyPassword as verifyPasswordHash, getDefaultPasswordHash } from './password';
import { eq } from 'drizzle-orm';

/**
 * 验证密码
 * @param password 用户输入的密码
 * @returns 是否验证通过
 */
export async function verifyPassword(password: string): Promise<boolean> {
  try {
    const { env } = getCloudflareContext();
    const db = createDb(env.DB);
    
    // 从数据库获取密码哈希
    const result = await db.select().from(admin).limit(1);
    
    if (result.length === 0) {
      // 如果数据库中没有密码，初始化默认密码
      const defaultHash = await getDefaultPasswordHash();
      await db.insert(admin).values({ password_hash: defaultHash });
      
      // 验证输入的密码是否是默认密码
      return await verifyPasswordHash(password, defaultHash);
    }
    
    // 验证密码
    return await verifyPasswordHash(password, result[0].password_hash);
  } catch (error) {
    console.error('[AUTH] Password verification failed:', error);
    return false;
  }
}

/**
 * 修改密码
 * @param newPassword 新密码
 * @returns 是否修改成功
 */
export async function changePassword(newPassword: string): Promise<boolean> {
  try {
    const { env } = getCloudflareContext();
    const db = createDb(env.DB);
    const { hashPassword } = await import('./password');
    
    const newHash = await hashPassword(newPassword);
    
    // 检查是否已有记录
    const result = await db.select().from(admin).limit(1);
    
    if (result.length === 0) {
      // 插入新记录
      await db.insert(admin).values({ password_hash: newHash });
    } else {
      // 更新现有记录
      await db.update(admin)
        .set({ 
          password_hash: newHash,
          updated_at: new Date()
        })
        .where(eq(admin.id, result[0].id));
    }
    
    return true;
  } catch (error) {
    console.error('[AUTH] Password change failed:', error);
    return false;
  }
}

// 客户端使用 localStorage 存储登录状态
export const AUTH_KEY = 'jiugenav_admin_auth';

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(AUTH_KEY) === 'true';
}

export function login(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_KEY, 'true');
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_KEY);
}
