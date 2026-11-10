import { card } from "@/lib/styles";

// Grey placeholder with the same layout as JobListing, shown while loading.
const Bar = ({ className }: { className: string }) => (
  <div className={`bg-slate-200/70 rounded ${className}`} />
);

const JobCardSkeleton = () => {
  return (
    <div className={`${card} animate-pulse p-5`} aria-hidden>
      <div className="flex items-start gap-3">
        <Bar className="h-11 w-11 rounded-xl" />
        <div className="flex-1 space-y-2 pt-1">
          <Bar className="h-3.5 w-32" />
          <Bar className="h-3 w-24" />
        </div>
      </div>
      <Bar className="mt-5 h-5 w-3/4" />
      <div className="mt-3 space-y-2">
        <Bar className="h-3.5 w-full" />
        <Bar className="h-3.5 w-2/3" />
      </div>
      <div className="mt-5 flex items-center gap-2">
        <Bar className="h-5 w-16 rounded-full" />
        <Bar className="h-5 w-14 rounded-full" />
        <Bar className="ml-auto h-4 w-24" />
      </div>
      <Bar className="mt-5 h-3 w-28" />
    </div>
  );
};

export default JobCardSkeleton;
