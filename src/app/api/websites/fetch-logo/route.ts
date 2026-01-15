import { NextResponse } from 'next/server';

function resolveUrl(href: string, baseUrl: string) {
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  }
  if (href.startsWith('//')) {
    return 'https:' + href;
  }
  if (href.startsWith('/')) {
    return baseUrl + href;
  }
  return baseUrl + '/' + href;
}

async function fetchLogo(websiteUrl: string) {
  try {
    const url = new URL(websiteUrl);
    const baseUrl = `${url.protocol}//${url.host}`;

    const response = await fetch(websiteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const html = await response.text();
    
    const linkRegex = /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["'][^>]*>/i;
    const match = html.match(linkRegex);

    if (match && match[1]) {
        const resolved = resolveUrl(match[1], baseUrl);
        if (resolved.startsWith('http://')) {
            return `https://www.google.com/s2/favicons?domain=${url.host}&sz=64`;
        }
        return resolved;
    }
    
    const appleLinkRegex = /<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["'][^>]*>/i;
    const appleMatch = html.match(appleLinkRegex);
    if (appleMatch && appleMatch[1]) {
        const resolved = resolveUrl(appleMatch[1], baseUrl);
        if (resolved.startsWith('http://')) {
            return `https://www.google.com/s2/favicons?domain=${url.host}&sz=64`;
        }
        return resolved;
    }

    const faviconUrl = `${baseUrl}/favicon.ico`;
    try {
      const headRes = await fetch(faviconUrl, { method: 'HEAD' });
      if (headRes.ok) return faviconUrl;
    } catch (err) {}

    return `https://www.google.com/s2/favicons?domain=${url.host}&sz=64`;
  } catch (error) {
    try {
      const url = new URL(websiteUrl);
      return `https://www.google.com/s2/favicons?domain=${url.host}&sz=64`;
    } catch (err) {
      return null;
    }
  }
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json() as { url: string };
    if (!url) return new NextResponse('URL is required', { status: 400 });

    const logoUrl = await fetchLogo(url);
    return NextResponse.json({ logoUrl });
  } catch (error) {
    console.error('[FETCH_LOGO]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
