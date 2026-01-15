// API 客户端 - 自动添加用户认证信息到请求头

import { getUserSession } from './user-auth';

/**
 * API 客户端 - 包装 fetch，自动添加认证头
 */
export async function apiClient(url: string, options: RequestInit = {}): Promise<Response> {
  const session = getUserSession();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  // 添加用户认证信息
  if (session) {
    headers['X-User-Id'] = session.userId.toString();
    headers['X-Is-Admin'] = session.isAdmin.toString();
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * GET 请求
 */
export async function apiGet<T = any>(url: string): Promise<T> {
  const response = await apiClient(url, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
}

/**
 * POST 请求
 */
export async function apiPost<T = any>(url: string, data: any): Promise<T> {
  const response = await apiClient(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
}

/**
 * PUT 请求
 */
export async function apiPut<T = any>(url: string, data: any): Promise<T> {
  const response = await apiClient(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
}

/**
 * DELETE 请求
 */
export async function apiDelete<T = any>(url: string): Promise<T> {
  const response = await apiClient(url, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
}
