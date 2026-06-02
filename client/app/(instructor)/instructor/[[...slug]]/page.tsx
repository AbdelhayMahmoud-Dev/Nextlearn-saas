import { ComingSoon } from '@/components/common/ComingSoon';

const titleFor = (slug?: string[]): string => {
  const section = slug?.[0] ?? 'dashboard';
  return `Instructor · ${section.charAt(0).toUpperCase()}${section.slice(1)}`;
};

export default function InstructorPage({ params }: { params: { slug?: string[] } }): JSX.Element {
  return <ComingSoon title={titleFor(params.slug)} phase="Phase 3 (Instructor Tools)" />;
}
