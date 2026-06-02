import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nextlearn.com';

/** robots.txt — allow public marketing/catalog pages, block authenticated areas. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/courses', '/courses/*', '/verify/*', '/signup/tenant'],
        disallow: [
          '/dashboard',
          '/my-courses',
          '/certificates',
          '/profile',
          '/learn/*',
          '/billing',
          '/subscription',
          '/notifications',
          '/instructor/*',
          '/admin/*',
          '/superadmin/*',
          '/api/*',
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
