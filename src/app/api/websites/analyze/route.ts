import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

function resolveUrl(href: string, baseUrl: string) {
  try {
    return new URL(href, baseUrl).href;
  } catch (e) {
    return href;
  }
}

function extractMetaContent(html: string, patterns: string[]): string {
  for (const pattern of patterns) {
    const regex = new RegExp(pattern, 'i');
    const match = html.match(regex);
    if (match && match[1]) {
      return match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    }
  }
  return '';
}

async function getAiAnalysis(title: string, rawDescription: string, url: string) {
    try {
        const { env } = getCloudflareContext();
        
        const prompt = `我正在整理一个网站导航，请根据以下信息分析这个网站：
网址：${url}
标题：${title}
原始描述：${rawDescription}

请返回 JSON 格式数据，包含以下字段：
1. "name": 网站品牌名称（不超过10个字）。只提取核心品牌名，去掉"官网"、"首页"、slogan等无关词汇。例如 "GitHub - Where the world builds software" 应提取为 "GitHub"。
2. "summary": 中文简要介绍（20-50字），简洁明了，突出核心功能。
3. "category": 推荐的分类名称（2-6个字），例如"设计工具"、"搜索引擎"、"开发文档"、"生活服务"等。请尽量使用通用的分类。

仅返回 JSON 字符串，不要包含 Markdown 代码块标记。`;

        // 使用 Cloudflare Workers AI - GPT-OSS 120B 模型
        const response = await env.AI.run('@cf/openai/gpt-oss-120b' as any, {
            messages: [
                { role: 'system', content: '你是一个专业的网站导航编辑助手，请只返回纯 JSON 格式数据。' },
                { role: 'user', content: prompt }
            ]
        }) as { response: string };

        const content = response.response?.trim();
        
        try {
            // Remove markdown code blocks if present
            const jsonStr = content.replace(/^```json\n|\n```$/g, '').replace(/^```\n|\n```$/g, '');
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error('Failed to parse AI JSON:', content);
            return { summary: content, category: '', name: '' };
        }
    } catch (e) {
        console.error('Cloudflare AI analysis failed:', e);
        return null;
    }
}

export async function POST(req: Request) {
  let inputUrl = '';
  try {
    const body = await req.json() as { url: string };
    inputUrl = body.url;
    if (!inputUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Add protocol if missing
    let targetUrl = inputUrl;
    if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
        targetUrl = `https://${inputUrl}`;
    }

    const urlObj = new URL(targetUrl);
    
    // 默认返回值
    let title = '';
    let description = '';
    let category = '';
    let logoUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;

    try {
      const { env } = getCloudflareContext();
      
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        }
      });

      const html = await response.text();

      // 使用正则表达式提取信息（避免使用 cheerio，因为它在 Workers 环境中有兼容性问题）
      
      // Get Title
      title = extractMetaContent(html, [
        '<title[^>]*>([^<]+)</title>',
        '<meta\\s+property="og:title"\\s+content="([^"]+)"',
        '<meta\\s+name="twitter:title"\\s+content="([^"]+)"'
      ]);
      
      // Get Description
      description = extractMetaContent(html, [
        '<meta\\s+name="description"\\s+content="([^"]+)"',
        '<meta\\s+property="og:description"\\s+content="([^"]+)"',
        '<meta\\s+name="twitter:description"\\s+content="([^"]+)"'
      ]);

      // Get Logo
      const iconLink = extractMetaContent(html, [
        '<link\\s+rel="icon"[^>]+href="([^"]+)"',
        '<link\\s+rel="shortcut icon"[^>]+href="([^"]+)"',
        '<link\\s+rel="apple-touch-icon"[^>]+href="([^"]+)"'
      ]);
      
      if (iconLink) {
          logoUrl = resolveUrl(iconLink, targetUrl);
      }

      // 使用 Cloudflare Workers AI 进行智能分析（可选，失败不影响返回）
      // 暂时禁用 AI 调用进行测试
      /*
      if ((title || description) && env.AI) {
        try {
          // 使用 Promise.race 实现超时
          const aiPromise = getAiAnalysis(title, description, targetUrl);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('AI timeout')), 15000)
          );
          
          const aiData = await Promise.race([aiPromise, timeoutPromise]) as any;
          
          if (aiData) {
              if (aiData.name) title = aiData.name;
              if (aiData.summary) description = aiData.summary;
              if (aiData.category) category = aiData.category;
          }
        } catch (aiError) {
          console.error('[AI_ANALYSIS_ERROR]', aiError);
          // AI 失败不影响返回基本信息
        }
      }
      */
    } catch (fetchError) {
      console.error('[FETCH_ERROR]', fetchError);
      // Fetch 失败也返回基本信息
    }

    return NextResponse.json({ 
      title, 
      description, 
      category,
      logoUrl,
      url: targetUrl
    });

  } catch (error) {
    console.error('[ANALYZE_URL_ERROR]', error);
    // 返回 JSON 错误而不是纯文本
    return NextResponse.json(
      { 
        error: 'Failed to analyze URL',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
