# UpUpNav

一个现代化的个人网站导航管理系统，基于 Next.js 14 和 Cloudflare D1 构建，可部署在 Cloudflare Workers 上实现全球低延迟访问。

## ✨ 特性

- 📁 分组管理 - 创建、编辑、删除网站分组，支持自定义 Emoji 图标
- 🌐 网站管理 - 添加、编辑、删除网站链接
- 🤖 AI 智能分析 - 使用 Cloudflare Workers AI 自动识别网站信息
- 🎨 自动获取 Logo - 自动抓取网站图标
- 🔍 智能搜索 - 按名称、URL、描述搜索网站
- 🔐 简单认证 - 密码保护的管理功能
- 📊 点击统计 - 记录网站访问次数
- 📤 数据导入/导出 - 支持数据备份和迁移
- 📱 响应式设计 - 完美支持移动端和桌面端

## 🚀 技术栈

- Next.js 14 (App Router) + React 18
- Cloudflare D1 (SQLite) + Drizzle ORM
- Cloudflare Workers AI (GPT-OSS 120B)
- Tailwind CSS + Lucide React
- OpenNext for Cloudflare Workers

## 📦 快速开始

### 1. 克隆并安装

```bash
git clone <your-repo-url>
cd upupnav
npm install
```

### 2. 配置数据库

```bash
# 创建 Cloudflare D1 数据库
wrangler d1 create upupnav

# 将返回的 database_id 更新到 wrangler.toml 中
```

编辑 `wrangler.toml`，更新 `database_id`：
```toml
[[d1_databases]]
binding = "DB"
database_name = "upupnav"
database_id = "your-database-id-here"  # 替换为你的数据库 ID
migrations_dir = "drizzle"
```

### 3. 初始化数据库

```bash
npm run db:migrate:local
```

### 4. 启动开发服务器

**方式一：使用本地数据库（快速开发）**
```bash
npm run dev
# 访问 http://localhost:3000
```

**方式二：使用远程数据库（推荐）**
```bash
# 1. 构建项目
npm run build:worker

# 2. 启动开发服务器（连接远程数据库）
npx wrangler dev .open-next/worker.js
# 访问 http://localhost:8787
```

默认管理员密码：`admin123`

**修改密码**：如需修改，可通过环境变量设置：
```bash
# 生产环境
wrangler secret put ADMIN_PASSWORD
```

## 🌐 部署到 Cloudflare

详细部署说明请查看 [docs/DEPLOY.md](docs/DEPLOY.md)

**快速部署：**

```bash
# 1. 生产数据库迁移
npm run db:migrate:prod

# 2. 设置生产环境密码（可选，默认为 admin123）
wrangler secret put ADMIN_PASSWORD

# 3. 构建并部署
npm run build:worker
npm run deploy
```

**自动部署：**

推送到 GitHub 后，Cloudflare Pages 会自动检测并部署。确保在 Cloudflare Dashboard 中配置了：
- 连接 GitHub 仓库
- 构建命令：`npm run build:worker`
- 输出目录：`.open-next`
- 环境变量：`ADMIN_PASSWORD`（可选）

## 🔧 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（使用本地数据库） |
| `npm run dev:remote` | 启动开发服务器（使用远程数据库） |
| `npm run build` | 构建 Next.js |
| `npm run build:worker` | 构建 Cloudflare Worker |
| `npm run preview` | 本地预览 Worker |
| `npm run deploy` | 部署到 Cloudflare |
| `npm run db:migrate:local` | 本地数据库迁移 |
| `npm run db:migrate:prod` | 生产数据库迁移 |

## 📁 项目结构

```
src/
├── app/
│   ├── api/              # API 路由（groups, websites, health）
│   └── page.tsx          # 主页
├── components/           # React 组件
├── db/                   # 数据库配置和 Schema
├── lib/                  # 工具库（auth, utils）
└── types/               # TypeScript 类型
```

## 🔒 安全说明

- 默认管理员密码为 `admin123`，可通过 Cloudflare 环境变量修改
- `wrangler.toml` 中的 `database_id` 可以公开，需要 Cloudflare 账号权限才能访问数据库
- 生产环境建议修改默认密码：`wrangler secret put ADMIN_PASSWORD`
- Workers AI 无需 API Key，完全免费使用

## 🤖 AI 功能

项目集成了 Cloudflare Workers AI，使用 `@cf/openai/gpt-oss-120b` 模型：
- ✅ 完全免费，无需 API Key
- ✅ 自动识别网站名称、描述和分类
- ✅ 智能推荐分组
- ✅ 边缘计算，响应快速

详细说明请查看 [docs/AI_ARCHITECTURE.md](docs/AI_ARCHITECTURE.md)

## 📚 文档

- [部署指南](docs/DEPLOY.md) - 详细的部署步骤
- [AI 架构](docs/AI_ARCHITECTURE.md) - AI 功能实现原理
- [项目结构](docs/PROJECT_STRUCTURE.md) - 代码组织说明
- [贡献指南](docs/CONTRIBUTING.md) - 如何参与开发
- [更新日志](docs/CHANGELOG.md) - 版本更新记录

## 📝 许可证

MIT License
