import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PublicServicesPageSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-vynal-purple-dark">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest py-8 lg:py-14 relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto pt-4">
            <Skeleton className="h-6 w-32 rounded-full mx-auto mb-4 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
            <Skeleton className="h-10 w-64 rounded-lg mx-auto mb-4 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
            <Skeleton className="h-4 w-48 rounded mx-auto bg-gray-100 dark:bg-vynal-purple-secondary/30" />
          </div>
          
          {/* Categories grid */}
          <div className="max-w-5xl mx-auto mt-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {Array(12).fill(0).map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <Skeleton className="h-12 w-12 rounded-full mb-2 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                  <Skeleton className="h-4 w-20 rounded bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Navigation bar */}
      <section className="bg-vynal-purple-dark/90 border-y border-vynal-purple-secondary/30 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-48 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded-full bg-gray-100 dark:bg-vynal-purple-secondary/30" />
              <Skeleton className="h-8 w-24 rounded-md bg-gray-100 dark:bg-vynal-purple-secondary/30" />
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="container mx-auto px-4 py-12">
        {/* Results header */}
        <div className="flex justify-between mb-6">
          <div>
            <Skeleton className="h-6 w-64 mb-2 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
            <Skeleton className="h-4 w-32 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
          </div>
        </div>
        
        {/* Service Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(12).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden dark:border-vynal-purple-secondary/30">
              <Skeleton className="w-full h-40 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-16 mb-2 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                <Skeleton className="h-6 w-full mb-1 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                <Skeleton className="h-4 w-5/6 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                <div className="flex justify-between items-center mt-3 pt-3 border-t dark:border-vynal-purple-secondary/30">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-8 rounded-full bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                    <Skeleton className="h-5 w-20 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                  </div>
                  <Skeleton className="h-8 w-16 rounded-full bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Pagination */}
        <div className="flex justify-center mt-8">
          <Skeleton className="h-8 w-64 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
        </div>
      </div>
    </div>
  );
} 