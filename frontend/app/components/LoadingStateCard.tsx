"use client";

interface LoadingStateCardProps {
  title: string;
  subtitle: string;
  showSkeleton?: boolean;
}

export default function LoadingStateCard({ title, subtitle, showSkeleton = true }: LoadingStateCardProps) {
  return (
    <div className="card space-y-4 py-6">
      <div className="flex items-center gap-4">
        <div className="relative flex items-center justify-center w-10 h-10 flex-shrink-0">
          <span className="absolute w-full h-full rounded-full border-2 border-accent-500/30 animate-spin border-t-accent-500" />
        </div>
        <div>
          <p className="text-relief-200 font-medium text-sm">{title}</p>
          <p className="text-relief-500 text-xs mt-0.5">{subtitle}</p>
        </div>
      </div>

      {showSkeleton && (
        <div className="space-y-2">
          <div className="skeleton h-3 w-5/6" />
          <div className="skeleton h-3 w-3/4" />
          <div className="skeleton h-3 w-2/3" />
        </div>
      )}
    </div>
  );
}
