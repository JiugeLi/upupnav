# 项目结构说明

## �� 目录结构

```
jiugenav/
├── .github/                    # GitHub 配置
│   ├── ISSUE_TEMPLATE/        # Issue 模板
│   ├── workflows/             # GitHub Actions
│   └── pull_request_template.md
├── drizzle/                   # 数据库迁移文件
│   ├── meta/                  # 迁移元数据
│   └── *.sql                  # SQL 迁移脚本
├── public/                    # 静态资源
│   └── favicon.ico
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # API 路由
│   │   │   ├── groups/       # 分组 CRUD
│   │   │   ├── websites/     # 网站 CRUD
│   │   │   ├── health/       # 健康检查
│   │   │   └── test-*/       # 测试端点
│   │   ├── globals.css       # 全局样式
│   │   ├── layout.tsx        # 根布局
│   │   └── page.tsx          # 首页
│   ├── components/           # React 组件
│   │   ├── Dashboard.tsx     # 主面板
│   │   ├── GroupModal.tsx    # 分组弹窗
│   │   ├── WebsiteModal.tsx  # 网站弹窗
│   │   ├── LoginModal.tsx    # 登录弹窗
│   │   └── SettingsModal.tsx # 设置弹窗
│   ├── db/                   # 数据库
│   │   ├── index.ts         # Drizzle 客户端
│   │   └── schema.ts        # 数据库 Schema
│   ├── lib/                  # 工具库
│   │   ├── auth.ts          # 认证逻辑
│   │   └── utils.ts         # 工具函数
│   ├── types/               # TypeScript 类型
│   │   └── index.ts
│   └── middleware.ts        # Next.js 中间件
├── .dev.vars                 # 本地环境变量（不提交）
├── .env.example              # 环境变量示例
├── .gitignore               # Git 忽略文件
├── CONTRIBUTING.md          # 贡献指南
├── DEPLOY.md                # 部署文档
├── README.md                # 项目说明
├── drizzle.config.ts        # Drizzle 配置
├── next.config.mjs          # Next.js 配置
├── open-next.config.ts      # OpenNext 配置
├── package.json             # 项目依赖
├── postcss.config.js        # PostCSS 配置
├── tailwind.config.ts       # Tailwind 配置
├── tsconfig.json            # TypeScript 配置
└── wrangler.toml            # Cloudflare 配置
```

## 📄 核心文件说明

### 配置文件

| 文件 | 说明 |
|------|------|
| `wrangler.toml` | Cloudflare Workers 配置 |
| `drizzle.config.ts` | Drizzle ORM 配置 |
| `next.config.mjs` | Next.js 配置 |
| `open-next.config.ts` | OpenNext for Cloudflare 配置 |
| `tailwind.config.ts` | Tailwind CSS 配置 |
| `tsconfig.json` | TypeScript 配置 |

### 环境变量

| 文件 | 说明 | 提交到 Git |
|------|------|-----------|
| `.env.example` | 环境变量示例 | ✅ 是 |
| `.dev.vars` | 本地开发配置 | ❌ 否 |

### 文档

| 文件 | 说明 |
|------|------|
| `README.md` | 项目介绍和快速开始 |
| `DEPLOY.md` | 详细部署指南 |
| `CONTRIBUTING.md` | 贡献指南 |
| `LICENSE` | MIT 许可证 |

## 🗄️ 数据库结构

### groups 表
- `id` - 主键
- `name` - 分组名称
- `icon` - Emoji 图标
- `sort_order` - 排序
- `created_at` - 创建时间

### websites 表
- `id` - 主键
- `group_id` - 所属分组（外键）
- `name` - 网站名称
- `url` - 网站地址
- `logo_url` - Logo 地址
- `logo_type` - Logo 类型
- `description` - 描述
- `username` - 用户名（可选）
- `password` - 密码（可选）
- `sort_order` - 排序
- `click_count` - 点击次数
- `last_clicked_at` - 最后点击时间
- `created_at` - 创建时间

## 🔌 API 路由

### Groups API
- `GET /api/groups` - 获取所有分组
- `POST /api/groups` - 创建分组
- `PUT /api/groups/:id` - 更新分组
- `DELETE /api/groups/:id` - 删除分组

### Websites API
- `GET /api/websites` - 获取所有网站
- `POST /api/websites` - 创建网站
- `PUT /api/websites/:id` - 更新网站
- `DELETE /api/websites/:id` - 删除网站
- `POST /api/websites/:id/click` - 记录点击

### Other API
- `GET /api/health` - 健康检查
- `GET /api/test-db` - 测试数据库连接
- `GET /api/test-env` - 测试环境变量

## 🎨 组件说明

| 组件 | 说明 |
|------|------|
| `Dashboard.tsx` | 主面板，包含分组列表和网站卡片 |
| `GroupModal.tsx` | 分组创建/编辑弹窗 |
| `WebsiteModal.tsx` | 网站创建/编辑弹窗 |
| `LoginModal.tsx` | 管理员登录弹窗 |
| `SettingsModal.tsx` | 设置弹窗（导入/导出） |

## 🔐 认证机制

- 使用 localStorage 存储登录状态
- 密码通过环境变量 `ADMIN_PASSWORD` 配置
- 默认密码: `admin123`
- 仅前端验证，适合个人使用

## 📦 依赖说明

### 核心依赖
- `next` - Next.js 框架
- `react` - React 库
- `drizzle-orm` - ORM
- `tailwindcss` - CSS 框架
- `lucide-react` - 图标库

### 开发依赖
- `@opennextjs/cloudflare` - Cloudflare 适配器
- `drizzle-kit` - 数据库迁移工具
- `wrangler` - Cloudflare CLI
- `typescript` - TypeScript

## 🚀 部署流程

1. 本地开发: `npm run dev`
2. 构建: `npm run build:worker`
3. 预览: `npm run preview`
4. 部署: `npm run deploy`

## 📝 注意事项

1. `.dev.vars` 包含敏感信息，不要提交到 Git
2. 生产环境使用 `wrangler secret` 管理密钥
3. 数据库迁移需要先在本地测试
4. 部署前确保环境变量配置正确
