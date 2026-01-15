# 贡献指南

感谢你对 UpUpNav 项目的关注！

## 开发环境设置

1. Fork 本仓库
2. 克隆你的 fork
   ```bash
   git clone https://github.com/your-username/upupnav.git
   cd upupnav
   ```
3. 安装依赖
   ```bash
   npm install
   ```
4. 配置环境变量
   ```bash
   cp .env.example .dev.vars
   # 编辑 .dev.vars 填入你的配置
   ```
5. 创建数据库并迁移
   ```bash
   wrangler d1 create upupnav
   npm run db:migrate:local
   ```
6. 启动开发服务器
   ```bash
   npm run dev
   ```

## 提交代码

1. 创建新分支
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. 进行修改并提交
   ```bash
   git add .
   git commit -m "描述你的修改"
   ```
3. 推送到你的 fork
   ```bash
   git push origin feature/your-feature-name
   ```
4. 创建 Pull Request

## 代码规范

- 使用 TypeScript
- 遵循 ESLint 规则
- 保持代码简洁清晰
- 添加必要的注释

## 报告问题

如果你发现 bug 或有功能建议，请创建 Issue 并提供：
- 问题描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息（浏览器、Node.js 版本等）

## 许可证

提交代码即表示你同意将代码以 MIT 许可证发布。
