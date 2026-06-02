/** Course detail loading skeleton. */
export default function CourseDetailLoading(): JSX.Element {
  return (
    <div>
      <div className="border-b bg-muted/30">
        <div className="container grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-9 w-3/4 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-2/3 rounded" />
          </div>
          <div className="skeleton aspect-video rounded-xl lg:row-span-2" />
        </div>
      </div>
      <div className="container grid gap-10 py-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="skeleton h-7 w-48 rounded" />
          <div className="skeleton h-40 w-full rounded-xl" />
        </div>
        <div className="skeleton h-72 w-full rounded-xl" />
      </div>
    </div>
  );
}
