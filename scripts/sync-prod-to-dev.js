#!/usr/bin/env node

const { execSync } = require('child_process');

function runCommand(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e) {
    return e.stdout || '';
  }
}

function parseWranglerJson(output) {
  // 移除 wrangler 的输出信息，只保留 JSON
  const lines = output.split('\n');
  const jsonStart = lines.findIndex(line => line.trim().startsWith('['));
  if (jsonStart === -1) return null;
  const jsonStr = lines.slice(jsonStart).join('\n');
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('JSON 解析失败:', e.message);
    return null;
  }
}

console.log('📦 正在从生产环境导出数据...\n');

// 导出分组
const groupsOutput = runCommand('npx wrangler d1 execute upupnav --remote --command "SELECT * FROM groups ORDER BY id" --json');
const groupsData = parseWranglerJson(groupsOutput);

// 导出网站
const websitesOutput = runCommand('npx wrangler d1 execute upupnav --remote --command "SELECT * FROM websites ORDER BY id" --json');
const websitesData = parseWranglerJson(websitesOutput);

if (!groupsData || !websitesData) {
  console.error('❌ 数据导出失败');
  process.exit(1);
}

const groups = groupsData[0].results;
const websites = websitesData[0].results;

console.log(`✓ 找到 ${groups.length} 个分组`);
console.log(`✓ 找到 ${websites.length} 个网站\n`);

console.log('📥 正在导入到开发环境...\n');

// 导入分组
let groupSuccess = 0;
let groupSkip = 0;

for (const group of groups) {
  const name = group.name.replace(/'/g, "''");
  const icon = group.icon.replace(/'/g, "''");
  const sql = `INSERT INTO groups (id, name, icon, sort_order, user_id) VALUES (${group.id}, '${name}', '${icon}', ${group.sort_order}, ${group.user_id})`;
  
  const result = runCommand(`npx wrangler d1 execute upupnav-dev --remote --command "${sql}"`);
  
  if (result.includes('Success') || result.includes('Executed')) {
    groupSuccess++;
    console.log(`  ✓ ${group.name}`);
  } else {
    groupSkip++;
  }
}

console.log(`\n分组导入完成: ${groupSuccess} 成功, ${groupSkip} 跳过\n`);

// 导入网站
let websiteSuccess = 0;
let websiteSkip = 0;

for (const website of websites) {
  const name = (website.name || '').replace(/'/g, "''");
  const url = (website.url || '').replace(/'/g, "''");
  const desc = (website.description || '').replace(/'/g, "''");
  const logo = (website.logo_url || '').replace(/'/g, "''");
  const clickCount = website.click_count || 0;
  
  const sql = `INSERT INTO websites (id, name, url, description, logo_url, group_id, sort_order, click_count, user_id) VALUES (${website.id}, '${name}', '${url}', '${desc}', '${logo}', ${website.group_id}, ${website.sort_order}, ${clickCount}, ${website.user_id})`;
  
  const result = runCommand(`npx wrangler d1 execute upupnav-dev --remote --command "${sql}"`);
  
  if (result.includes('Success') || result.includes('Executed')) {
    websiteSuccess++;
    if (websiteSuccess % 10 === 0) {
      console.log(`  已导入 ${websiteSuccess}/${websites.length} 个网站...`);
    }
  } else {
    websiteSkip++;
  }
}

console.log(`\n网站导入完成: ${websiteSuccess} 成功, ${websiteSkip} 跳过\n`);
console.log('✅ 数据同步完成！');
console.log('\n开发环境: https://cloud-nav-dev.hgzlb202.workers.dev');
console.log('生产环境: https://cloud-nav.hgzlb202.workers.dev');
