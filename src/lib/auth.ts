// 简单的本地认证
// 管理员密码可以通过环境变量配置，默认为 admin123
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export function verifyPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

// 客户端使用 localStorage 存储登录状态
export const AUTH_KEY = 'upupnav_admin_auth';

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
