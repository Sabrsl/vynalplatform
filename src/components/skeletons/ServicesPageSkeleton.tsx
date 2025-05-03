import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ServicesPageSkeleton() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-vynal-purple-dark flex flex-col items-center justify-start pt-6 animate-in fade-in">
      <div className="container mx-auto px-4 w-full max-w-7xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-3">
            <div>
              <Skeleton className="h-8 w-48 mb-2 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
              <Skeleton className="h-4 w-64 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Skeleton className="h-8 w-8 rounded-md bg-gray-100 dark:bg-vynal-purple-secondary/30" />
              <Skeleton className="h-8 w-32 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="dark:border-vynal-purple-secondary/40">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                    <Skeleton className="h-7 w-16 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-full bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Tabs */}
          <Skeleton className="h-10 w-64 mb-4 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
          
          {/* Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="dark:border-vynal-purple-secondary/40">
                <div className="aspect-video relative overflow-hidden">
                  <Skeleton className="h-full w-full bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                </div>
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                  <Skeleton className="h-4 w-full bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                  <Skeleton className="h-4 w-1/2 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                  <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-6 w-20 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8 rounded-md bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                      <Skeleton className="h-8 w-8 rounded-md bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Pagination */}
          <div className="flex justify-center mt-8">
            <Skeleton className="h-8 w-48 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
          </div>
        </div>
      </div>
    </div>
  );
} 