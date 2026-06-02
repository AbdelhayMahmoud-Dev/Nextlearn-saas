/**
 * Suspense boundary shown during navigation to /notifications.
 */
export default function NotificationsLoading(): JSX.Element {
  return (
    <div className="container max-w-2xl py-10">
      <div className="skeleton mb-6 h-8 w-48 rounded" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
