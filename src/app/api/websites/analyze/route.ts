import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { getCloudflareContext } from '@opennextjs/cloudflare';

function resolveUrl(href: string, baseUrl: string) {
  try {
    return new URL(href, baseUrl).href;
  } catch (e) {
    return href;
  }
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
    if (!inputUrl) return new NextResponse('URL is required', { status: 400 });

    // Add protocol if missing
    let targetUrl = inputUrl;
    if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
        targetUrl = `https://${inputUrl}`;
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Get Title
    let title = $('title').text().trim() || 
                $('meta[property="og:title"]').attr('content') || 
                $('meta[name="twitter:title"]').attr('content') ||
                '';
    
    // Get Description
    let description = $('meta[name="description"]').attr('content') || 
                        $('meta[property="og:description"]').attr('content') || 
                        $('meta[name="twitter:description"]').attr('content') ||
                        '';

    let category = '';

    // 使用 Cloudflare Workers AI 进行智能分析
    const aiData = await getAiAnalysis(title, description, targetUrl);
    if (aiData) {
        if (aiData.name) title = aiData.name;
        if (aiData.summary) description = aiData.summary;
        if (aiData.category) category = aiData.category;
    }

    // Get Logo
    let logoUrl = '';
    // Priority: icon > shortcut icon > apple-touch-icon
    const iconLink = $('link[rel="icon"]').last().attr('href') || 
                     $('link[rel="shortcut icon"]').last().attr('href') ||
                     $('link[rel="apple-touch-icon"]').attr('href');
    
    const urlObj = new URL(targetUrl);
    
    if (iconLink) {
        logoUrl = resolveUrl(iconLink, targetUrl);
    } else {
        // Fallback to Google Favicon service
        logoUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
    }

    return NextResponse.json({ 
      title, 
      description, 
      category,
      logoUrl,
      url: targetUrl
    });

  } catch (error) {
    console.error('[ANALYZE_URL]', error);
    // Even if fetch fails, we can return the URL and maybe a default logo
    try {
        let targetUrl = inputUrl;
        if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
            targetUrl = `https://${inputUrl}`;
        }
        const urlObj = new URL(targetUrl);
        return NextResponse.json({
            title: '',
            description: '',
            category: '',
            logoUrl: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`,
            url: targetUrl
        });
    } catch {
        return new NextResponse('Failed to analyze URL', { status: 500 });
    }
  }
}
