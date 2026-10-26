// Grey placeholder with the same layout as JobListing, shown while loading.
const Bar = ({ className }: { className: string }) => (
  <div className={`bg-gray-200 rounded ${className}`} />
);

const JobCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-md animate-pulse" aria-hidden>
      <div className="p-4">
        <div className="mb-6">
          <Bar className="h-4 w-32 my-2" />
          <Bar className="h-6 w-3/4" />
        </div>
        <div className="mb-5 space-y-2">
          <Bar className="h-4 w-full" />
          <Bar className="h-4 w-full" />
          <Bar className="h-4 w-2/3" />
        </div>
        <Bar className="h-4 w-12 mb-5" />
        <Bar className="h-5 w-40 mb-2" />
        <div className="border border-gray-100 mb-5"></div>
        <div className="flex flex-col lg:flex-row justify-between mb-4 gap-3">
          <Bar className="h-5 w-28" />
          <Bar className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default JobCardSkeleton;
