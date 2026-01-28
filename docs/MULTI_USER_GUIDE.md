# 多用户系统指南

## 📋 系统架构

jiugeNav 现在支持多用户系统，每个用户拥有独立的网站和分组数据。

### 用户类型

1. **普通用户** - 通过 Google 账号登录，自动创建账户
2. **管理员** - 通过密码登录（保留用于系统管理）

### 数据隔离

- ✅ 每个用户只能看到自己的分组和网站
- ✅ 用户数据完全隔离
- ✅ 新用户首次登录自动创建账户

## 🔐 Google 一键登录

### 配置步骤

#### 1. 创建 Google OAuth 客户端

访问 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

1. 创建新项目或选择现有项目
2. 启用 "Google+ API"
3. 创建 OAuth 2.0 客户端 ID
4. 应用类型选择 "Web 应用"
5. 添加授权的 JavaScript 来源：
   ```
   http://localhost:8787  (本地开发)
   https://your-domain.workers.dev  (生产环境)
   ```
6. 添加授权的重定向 URI：
   ```
   http://localhost:8787
   https://your-domain.workers.dev
   ```
7. 复制客户端 ID

#### 2. 配置环境变量

**本地开发** - 创建 `.env.local`:
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

**生产环境** - 使用 Wrangler:
```bash
wrangler secret put NEXT_PUBLIC_GOOGLE_CLIENT_ID
```

或在 Cloudflare Dashboard 中配置环境变量。

### 前端集成

在登录页面添加 Google 登录按钮：

```typescript
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

function LoginPage() {
  const handleGoogleSuccess = async (credentialResponse) => {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: credentialResponse.credential }),
    });
    
    const data = await res.json();
    if (data.success) {
      // 保存用户会话
      saveUserSession(data.user);
      // 跳转到主页
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => console.log('Login Failed')}
      />
    </GoogleOAuthProvider>
  );
}
```

## 📊 数据库结构

### users 表
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar TEXT,
  google_id TEXT UNIQUE,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  last_login INTEGER
);
```

### groups 表（添加 user_id）
```sql
CREATE TABLE groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,  -- 新增：关联用户
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📁',
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### websites 表（添加 user_id）
```sql
CREATE TABLE websites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,  -- 新增：关联用户
  group_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  ...
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);
```

## 🔄 数据迁移

### 迁移现有数据

如果你已有单用户数据，需要迁移到多用户系统：

```sql
-- 1. 创建默认管理员用户
INSERT INTO users (email, name, google_id) 
VALUES ('admin@local', 'Admin', NULL);

-- 2. 获取管理员用户 ID
-- 假设 ID 为 1

-- 3. 更新所有分组
UPDATE groups SET user_id = 1;

-- 4. 更新所有网站
UPDATE websites SET user_id = 1;
```

## 🎯 API 变更

### 查询数据时过滤用户

所有 API 都需要根据当前用户过滤数据：

```typescript
// 获取当前用户的分组
const groups = await db.select()
  .from(groups)
  .where(eq(groups.user_id, currentUserId));

// 获取当前用户的网站
const websites = await db.select()
  .from(websites)
  .where(eq(websites.user_id, currentUserId));
```

### 创建数据时关联用户

```typescript
// 创建分组
await db.insert(groups).values({
  user_id: currentUserId,
  name: 'My Group',
  icon: '📁',
});

// 创建网站
await db.insert(websites).values({
  user_id: currentUserId,
  group_id: groupId,
  name: 'GitHub',
  url: 'https://github.com',
});
```

## 🔒 安全考虑

1. **Token 验证** - 所有 API 请求都需要验证用户身份
2. **数据隔离** - 严格按 user_id 过滤数据
3. **权限检查** - 用户只能操作自己的数据
4. **HTTPS** - 生产环境必须使用 HTTPS

## 📝 用户体验

### 首次登录
1. 用户点击 "Google 登录"
2. 跳转到 Google 授权页面
3. 授权后返回应用
4. 系统自动创建新用户账户
5. 显示空白的导航页面（可以开始添加网站）

### 再次登录
1. 用户点击 "Google 登录"
2. 自动识别已有账户
3. 加载用户的所有数据

## 🚀 部署注意事项

1. **环境变量** - 确保配置 `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
2. **数据库迁移** - 运行新的迁移脚本
3. **OAuth 配置** - 在 Google Console 添加生产域名
4. **测试** - 使用多个 Google 账号测试数据隔离

## 📚 相关文档

- [Google OAuth 文档](https://developers.google.com/identity/protocols/oauth2)
- [React OAuth Google](https://www.npmjs.com/package/@react-oauth/google)
- [Cloudflare Workers 环境变量](https://developers.cloudflare.com/workers/configuration/environment-variables/)

---

**最后更新**: 2025-01-15
