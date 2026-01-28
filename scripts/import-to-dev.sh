#!/bin/bash

# 从生产环境导出数据到开发环境的脚本

echo "正在从生产环境导出数据..."

# 导出分组数据
npx wrangler d1 execute upupnav --remote --command "SELECT id, name, icon, sort_order, user_id FROM groups ORDER BY id" --json > /tmp/groups.json

# 导出网站数据
npx wrangler d1 execute upupnav --remote --command "SELECT id, name, url, description, logo_url, group_id, sort_order, click_count, user_id FROM websites ORDER BY id" --json > /tmp/websites.json

echo "数据导出完成"
echo ""
echo "正在导入到开发环境..."

# 解析并导入分组数据
node -e "
const fs = require('fs');
const { execSync } = require('child_process');

const groupsData = JSON.parse(fs.readFileSync('/tmp/groups.json', 'utf8'));
const groups = groupsData[0].results;

console.log(\`找到 \${groups.length} 个分组\`);

for (const group of groups) {
  const sql = \`INSERT INTO groups (id, name, icon, sort_order, user_id) VALUES (\${group.id}, '\${group.name.replace(/'/g, \"''\")}', '\${group.icon}', \${group.sort_order}, \${group.user_id})\`;
  try {
    execSync(\`npx wrangler d1 execute upupnav-dev --remote --command \\\"\${sql}\\\"\`, { stdio: 'pipe' });
    console.log(\`✓ 导入分组: \${group.name}\`);
  } catch (e) {
    console.log(\`✗ 跳过分组: \${group.name} (可能已存在)\`);
  }
}
"

# 解析并导入网站数据
node -e "
const fs = require('fs');
const { execSync } = require('child_process');

const websitesData = JSON.parse(fs.readFileSync('/tmp/websites.json', 'utf8'));
const websites = websitesData[0].results;

console.log(\`找到 \${websites.length} 个网站\`);

for (const website of websites) {
  const name = website.name.replace(/'/g, \"''\");
  const url = website.url.replace(/'/g, \"''\");
  const desc = (website.description || '').replace(/'/g, \"''\");
  const logo = (website.logo_url || '').replace(/'/g, \"''\");
  
  const sql = \`INSERT INTO websites (id, name, url, description, logo_url, group_id, sort_order, click_count, user_id) VALUES (\${website.id}, '\${name}', '\${url}', '\${desc}', '\${logo}', \${website.group_id}, \${website.sort_order}, \${website.click_count || 0}, \${website.user_id})\`;
  
  try {
    execSync(\`npx wrangler d1 execute upupnav-dev --remote --command \\\"\${sql}\\\"\`, { stdio: 'pipe' });
    console.log(\`✓ 导入网站: \${website.name}\`);
  } catch (e) {
    console.log(\`✗ 跳过网站: \${website.name} (可能已存在)\`);
  }
}
"

echo ""
echo "导入完成！"
echo "开发环境: https://cloud-nav-dev.hgzlb202.workers.dev"
