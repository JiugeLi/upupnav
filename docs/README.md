# 📚 jiugeNav 文档中心

欢迎来到 jiugeNav 的文档中心！这里包含了项目的所有详细文档。

## 📖 文档导航

### 🚀 快速开始
- [部署指南](DEPLOY.md) - 如何部署到 Cloudflare Workers
- [项目结构](PROJECT_STRUCTURE.md) - 了解代码组织

### 🤖 AI 功能
- [AI 架构说明](AI_ARCHITECTURE.md) - Cloudflare Workers AI 实现原理
  - 如何使用 Workers AI
  - GPT-OSS 120B 模型
  - 智能网站分析流程

### 👥 参与贡献
- [贡献指南](CONTRIBUTING.md) - 如何参与项目开发
- [更新日志](CHANGELOG.md) - 版本更新记录

## 🎯 快速链接

### 核心功能
- **分组管理** - 创建、编辑、删除网站分组
- **网站管理** - 添加、编辑、删除网站链接
- **AI 智能分析** - 自动识别网站信息
- **点击统计** - 记录网站访问次数
- **密码管理** - 修改管理员密码

### 技术栈
- Next.js 14 + React 18
- Cloudflare D1 数据库
- Cloudflare Workers AI (GPT-OSS 120B)
- Drizzle ORM
- Tailwind CSS

## 🖥️ 本地开发

### 前置要求
1. Node.js 18+ 和 npm
2. Cloudflare 账户
3. Cloudflare API Token（用于本地访问远程 D1 数据库）

### 配置步骤

1. 复制 `.dev.vars.example` 到 `.dev.vars`（如果存在）
2. 编辑 `.dev.vars` 文件，配置以下环境变量：

```bash
# D1 数据库配置
D1_DATABASE_ID=ba95fd9d-5306-4cee-b3c0-b141ca87a776

# Cloudflare API 配置（用于本地开发连接远程 D1）
# 获取方式: https://dash.cloudflare.com/profile/api-tokens
# 需要 D1 模块的编辑权限
CLOUDFLARE_ACCOUNT_ID=your-account-id-here
CLOUDFLARE_API_TOKEN=your-api-token-here

# 管理员密码
ADMIN_PASSWORD=admin123
```

3. 安装依赖：
```bash
npm install
```

4. 启动开发服务器：
```bash
npm run dev
```

开发服务器将在 http://localhost:3000 启动，并连接到远程 Cloudflare D1 数据库。

## 📞 获取帮助

如果你在使用过程中遇到问题：
1. 查看相关文档
2. 在 GitHub 提交 Issue
3. 查看 [更新日志](CHANGELOG.md) 了解最新变化

## 🔗 相关链接

- [GitHub 仓库](https://github.com/your-username/jiugenav)
- [在线演示](https://cloud-nav.hgzlb202.workers.dev)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare Workers AI 文档](https://developers.cloudflare.com/workers-ai/)

---

**最后更新**: 2025-01-15
