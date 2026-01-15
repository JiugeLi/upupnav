# Cloudflare 部署指南

本项目使用 OpenNext for Cloudflare 部署到 Cloudflare Workers，数据库使用 Cloudflare D1。

## 前置条件

1. Node.js 18+
2. Wrangler CLI: `npm install -g wrangler`
3. Cloudflare 账号并登录: `wrangler login`

## 部署步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 配置数据库

```bash
# 创建 D1 数据库
wrangler d1 create upupnav

# 将返回的 database_id 更新到 wrangler.toml 中
```

编辑 `wrangler.toml`：
```toml
[[d1_databases]]
binding = "DB"
database_name = "upupnav"
database_id = "your-database-id-here"  # 替换为你的数据库 ID
```

### 3. 执行数据库迁移

```bash
# 本地测试
npm run db:migrate:local

# 生产环境
npm run db:migrate:prod
```

### 4. 本地预览

```bash
# 使用本地数据库预览
npm run preview

# 使用远程数据库预览（推荐）
npm run preview -- --remote
# 或使用新增的快捷命令
npm run dev:remote
```

### 5. 部署到 Cloudflare

```bash
# 设置生产环境密码
wrangler secret put ADMIN_PASSWORD

# 部署
npm run deploy
```

## 配置说明

### 管理员密码

**默认密码**: `admin123`

**修改密码**（生产环境推荐）:
```bash
# 使用 wrangler 命令设置
wrangler secret put ADMIN_PASSWORD

# 或在 Cloudflare Dashboard 的 Workers & Pages 设置中添加
```

### wrangler.toml

```toml
name = "cloud-nav"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]
main = ".open-next/worker.js"
assets = { directory = ".open-next/assets", binding = "ASSETS" }

[[d1_databases]]
binding = "DB"
database_name = "upupnav"
database_id = "your-database-id-here"  # 替换为你的数据库 ID
migrations_dir = "drizzle"
```

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 本地开发服务器 |
| `npm run build` | 构建 Next.js |
| `npm run build:worker` | 构建 Cloudflare Worker |
| `npm run preview` | 本地预览 Worker |
| `npm run deploy` | 部署到 Cloudflare |
| `npm run db:migrate:local` | 本地数据库迁移 |
| `npm run db:migrate:prod` | 生产数据库迁移 |

## 数据库结构

- **groups**: 网站分组（id, name, icon, sort_order, created_at）
- **websites**: 网站链接（id, group_id, name, url, logo_url, description, click_count 等）

## 故障排查

### 数据库连接失败
- 确认 `.dev.vars` 中的 `D1_DATABASE_ID` 正确
- 运行 `wrangler d1 list` 查看所有数据库

### 部署失败
- 运行 `wrangler whoami` 确认登录状态
- 确保已设置 `ADMIN_PASSWORD` 密钥

### 迁移失败
- 检查 `drizzle/` 目录下的 SQL 文件
- 确认数据库 ID 正确

### 环境变量未生效
- 本地开发使用 `.dev.vars` 文件
- 生产环境使用 `wrangler secret put` 或 Cloudflare Dashboard

## 安全注意事项

1. **不要提交敏感文件**
   - `.dev.vars` 已在 `.gitignore` 中
   - 确保不要提交包含真实数据库 ID 的文件

2. **使用强密码**
   - 不要使用默认的 `admin123`
   - 定期更换生产环境密码

3. **验证配置**
   ```bash
   # 检查敏感文件是否被忽略
   git status
   
   # 列出生产环境密钥
   wrangler secret list
   ```

## 相关资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [OpenNext for Cloudflare](https://opennext.js.org/cloudflare)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
