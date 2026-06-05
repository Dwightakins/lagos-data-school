export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-[#5EEAD4]/30 rounded-lg ${className ?? ""}`} />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#F0FDFA]">
      <div className="bg-[#134E4A] h-16 border-b border-white/8" />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Skeleton className="h-7 w-56 mb-2" />
        <Skeleton className="h-4 w-40 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-[#5EEAD4]">
              <Skeleton className="h-8 w-12 mb-2" />
              <Skeleton className="h-3.5 w-28" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-[#5EEAD4] p-6">
          <Skeleton className="h-5 w-28 mb-5" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-[#5EEAD4] rounded-xl p-5">
                <Skeleton className="w-10 h-10 rounded-lg mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-4" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="bg-white border-2 border-[#e7e9ea] rounded-2xl p-6">
      <Skeleton className="w-12 h-12 rounded-xl mb-4" />
      <Skeleton className="h-4 w-3/4 mb-3" />
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-5/6 mb-6" />
      <div className="border-t border-[#e7e9ea] pt-4 flex justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}
