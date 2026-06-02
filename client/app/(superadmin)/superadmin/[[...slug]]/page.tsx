import { ComingSoon } from '@/components/common/ComingSoon';

const titleFor = (slug?: string[]): string => {
  const section = slug?.[0] ?? 'tenants';
  return `SuperAdmin · ${section.charAt(0).toUpperCase()}${section.slice(1)}`;
};

export default function SuperAdminPage({ params }: { params: { slug?: string[] } }): JSX.Element {
  return <ComingSoon title={titleFor(params.slug)} phase="Phase 6 (White-Label SaaS Layer)" />;
}
