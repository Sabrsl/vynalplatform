import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="absolute inset-0 z-[9999] bg-vynal-purple-dark flex flex-col items-center justify-start pt-10 animate-in fade-in" data-testid="app-loading">
      <div className="container mx-auto px-4 w-full max-w-5xl">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-2/3">
            <Skeleton className="h-[400px] w-full mb-4 bg-vynal-purple-secondary/30" />
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full bg-vynal-purple-secondary/30" />
              ))}
            </div>
          </div>
          
          <div className="w-full md:w-1/3">
            <Skeleton className="h-8 w-3/4 mb-4 bg-vynal-purple-secondary/30" />
            <Skeleton className="h-6 w-1/2 mb-2 bg-vynal-purple-secondary/30" />
            <Skeleton className="h-32 w-full mb-6 bg-vynal-purple-secondary/30" />
            <Skeleton className="h-10 w-full mb-2 bg-vynal-purple-secondary/30" />
            <Skeleton className="h-10 w-full bg-vynal-purple-secondary/30" />
          </div>
        </div>
      </div>
    </div>
  );
} 