# 更新日志

## [最新版本] - 2025-01-15

### ✨ 新增功能
- 🤖 集成 Cloudflare Workers AI (GPT-OSS 120B 模型)
- 🎯 智能网站分析：自动识别网站名称、描述和分类
- 🔄 智能分组推荐：AI 自动匹配或创建分组
- 📊 点击统计功能：记录和显示网站访问次数
- 🔐 修改密码功能：登录后可修改管理员密码

### 🔧 优化改进
- ⚡ 使用 Cloudflare Workers AI 替代 OpenAI API（免费 + 无需配置）
- 🚀 边缘计算，AI 分析响应更快
- 📝 完善项目文档（AI_ARCHITECTURE.md）
- 🧹 清理临时文件和开发脚本

### 🗑️ 删除内容
- 移除 OpenAI API 依赖
- 删除临时数据文件（local-data.sql, remote-data.sql）
- 删除开发脚本（sync-db.js, sync-db.sh, start-remote.sh）
- 删除临时文档（SUMMARY.md, test-ai.md）

### 📦 技术栈
- Next.js 14 + React 18
- Cloudflare D1 数据库
- Cloudflare Workers AI (GPT-OSS 120B)
- Drizzle ORM
- Tailwind CSS

### 🔒 安全说明
- 默认密码：admin123（建议生产环境修改）
- Workers AI 无需 API Key
- 数据库 ID 可以公开（需要 Cloudflare 账号权限）
