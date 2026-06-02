/**
 * Suspense boundary shown during navigation to /certificates.
 */
export default function CertificatesLoading(): JSX.Element {
  return (
    <div className="container py-10">
      <div className="skeleton mb-6 h-8 w-56 rounded" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-44 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
