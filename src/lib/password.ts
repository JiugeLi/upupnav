// 密码加密和验证工具
// 使用 Web Crypto API（Cloudflare Workers 原生支持）

/**
 * 使用 SHA-256 哈希密码
 * @param password 明文密码
 * @returns 哈希后的密码（hex 格式）
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * 验证密码
 * @param password 明文密码
 * @param hash 存储的哈希值
 * @returns 是否匹配
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * 生成默认密码的哈希值
 * 默认密码：admin123
 */
export async function getDefaultPasswordHash(): Promise<string> {
  return await hashPassword('admin123');
}
