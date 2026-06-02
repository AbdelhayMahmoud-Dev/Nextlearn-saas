import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nextlearn.com';

/**
 * Dynamic sitemap: static marketing routes + published course detail pages.
 * Course fetch is best-effort — sitemap generation must never throw.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/courses`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/marketplace`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/instructors`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/signup/tenant`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  let courseRoutes: MetadataRoute.Sitemap = [];
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';
    const res = await fetch(`${apiUrl}/courses?limit=200&page=1`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = (await res.json()) as { data?: Array<{ slug: string; updatedAt: string }> };
      courseRoutes = (json.data ?? []).map((c) => ({
        url: `${BASE}/courses/${c.slug}`,
        lastModified: new Date(c.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch {
    // Degrade to static routes only.
  }

  return [...staticRoutes, ...courseRoutes];
}
