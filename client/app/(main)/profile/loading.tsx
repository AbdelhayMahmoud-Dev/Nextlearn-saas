/**
 * Suspense boundary shown during navigation to /profile.
 */
export default function ProfileLoading(): JSX.Element {
  return (
    <div className="container max-w-3xl py-10">
      <div className="skeleton mb-8 h-9 w-32 rounded" />
      <div className="skeleton mb-4 h-12 w-full rounded-lg" />
      <div className="skeleton h-96 w-full rounded-xl" />
    </div>
  );
}
