# 📁 项目文件结构总览

## 根目录文件

```
jiugenav/
├── README.md              # 项目主文档（唯一保留在根目录的文档）
├── LICENSE                # MIT 许可证
├── package.json           # 项目依赖和脚本
├── wrangler.toml          # Cloudflare Workers 配置
├── tsconfig.json          # TypeScript 配置
├── next.config.mjs        # Next.js 配置
├── tailwind.config.ts     # Tailwind CSS 配置
├── drizzle.config.ts      # Drizzle ORM 配置
├── open-next.config.ts    # OpenNext 配置
├── cloudflare-env.d.ts    # Cloudflare 环境类型定义
└── .env.example           # 环境变量示例
```

## 目录结构

### 📚 `/docs` - 文档目录
所有项目文档都在这里：
```
docs/
├── README.md              # 文档中心索引
├── AI_ARCHITECTURE.md     # AI 架构说明
├── DEPLOY.md              # 部署指南
├── PROJECT_STRUCTURE.md   # 项目结构详解
├── CONTRIBUTING.md        # 贡献指南
├── CHANGELOG.md           # 更新日志
├── PUSH_CHECKLIST.md      # 推送检查清单
├── READY_TO_PUSH.md       # 准备就绪报告
└── STRUCTURE_OVERVIEW.md  # 本文件
```

### 💻 `/src` - 源代码
```
src/
├── app/                   # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── auth/          # 认证相关
│   │   ├── groups/        # 分组管理
│   │   ├── websites/      # 网站管理
│   │   │   ├── analyze/   # AI 分析（核心功能）
│   │   │   └── [id]/      # 网站详情
│   │   └── health/        # 健康检查
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页
├── components/            # React 组件
│   ├── Dashboard.tsx      # 主面板
│   ├── WebsiteModal.tsx   # 网站编辑弹窗
│   ├── GroupModal.tsx     # 分组编辑弹窗
│   ├── SettingsModal.tsx  # 设置弹窗
│   └── ...
├── db/                    # 数据库
│   ├── schema.ts          # 数据库 Schema
│   └── index.ts           # 数据库连接
├── lib/                   # 工具库
│   ├── auth.ts            # 认证工具
│   └── utils.ts           # 通用工具
└── types/                 # TypeScript 类型
    └── index.ts
```

### 🗄️ `/drizzle` - 数据库迁移
```
drizzle/
├── 0000_silky_trauma.sql  # 初始数据库结构
└── meta/                  # 迁移元数据
```

### 🎨 `/public` - 静态资源
```
public/
└── favicon.ico            # 网站图标
```

### ⚙️ `/.github` - GitHub 配置
```
.github/
├── ISSUE_TEMPLATE/        # Issue 模板
│   ├── bug_report.md
│   └── feature_request.md
├── workflows/             # GitHub Actions
│   └── lint.yml
└── pull_request_template.md
```

## 构建输出目录（已忽略）

这些目录由构建过程生成，不会提交到 Git：

```
/.next/                    # Next.js 构建输出
/.open-next/               # OpenNext 构建输出（用于 Cloudflare）
/.wrangler/                # Wrangler 本地开发缓存
/node_modules/             # npm 依赖
```

## 关键文件说明

### 配置文件
- `wrangler.toml` - Cloudflare Workers 配置，包含 D1 和 AI 绑定
- `cloudflare-env.d.ts` - Cloudflare 环境类型定义（DB, AI, ASSETS）
- `drizzle.config.ts` - 数据库 ORM 配置
- `next.config.mjs` - Next.js 配置，包含 OpenNext 适配器

### 核心功能文件
- `src/app/api/websites/analyze/route.ts` - AI 智能分析 API
- `src/components/WebsiteModal.tsx` - 网站编辑界面（调用 AI）
- `src/db/schema.ts` - 数据库表结构定义

### 文档文件
- `README.md` - 项目主文档（根目录）
- `docs/` - 所有其他文档

## 文档组织原则

1. **根目录只保留 README.md** - 作为项目入口
2. **所有详细文档放在 docs/** - 保持根目录整洁
3. **docs/README.md** - 作为文档中心索引
4. **文档间相互链接** - 方便导航

## 为什么这样组织？

### 优点
✅ 根目录整洁，一目了然  
✅ 文档集中管理，易于维护  
✅ 符合开源项目最佳实践  
✅ 便于 GitHub Pages 部署文档  
✅ 清晰的文档导航结构  

### 文档访问
- 从根目录 README.md 链接到 docs/
- docs/README.md 提供完整的文档导航
- 每个文档都可以独立访问

---

**最后更新**: 2025-01-15
