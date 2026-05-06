import { NextRequest, NextResponse } from 'next/server';

const allowedHostnames = new Set([
  'skillicons.dev',
  'img.shields.io',
]);

const allowedContentTypes = [
  'image/svg+xml',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
];

const cacheControl = 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000';

const createError = (message: string, status: number) => {
  return NextResponse.json({ message }, { status });
};

const isAllowedContentType = (contentType: string) => {
  const normalized = contentType.split(';', 1)[0].trim().toLowerCase();
  return allowedContentTypes.includes(normalized);
};

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url');

  if (!rawUrl) {
    return createError('Missing url', 400);
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return createError('Invalid url', 400);
  }

  if (target.protocol !== 'https:' || !allowedHostnames.has(target.hostname.toLowerCase())) {
    return createError('Unsupported image source', 400);
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
      next: {
        revalidate: 604800,
      },
    });
  } catch {
    return createError('Failed to fetch image', 502);
  }

  if (!upstream.ok || !upstream.body) {
    return createError('Failed to fetch image', 502);
  }

  const contentType = upstream.headers.get('content-type') || '';
  if (!isAllowedContentType(contentType)) {
    return createError('Unsupported image type', 502);
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
    },
  });
}
