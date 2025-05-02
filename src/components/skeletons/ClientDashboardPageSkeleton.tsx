import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ClientDashboardPageSkeleton() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-vynal-purple-dark flex flex-col items-center justify-start pt-6 animate-in fade-in">
      <div className="container mx-auto px-4 w-full max-w-6xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col space-y-1 mb-6">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-32 bg-vynal-purple-secondary/30" />
              <Skeleton className="h-6 w-24 bg-vynal-purple-secondary/30" />
            </div>
            <Skeleton className="h-4 w-48 bg-vynal-purple-secondary/30" />
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="dark:border-vynal-purple-secondary/40">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24 bg-vynal-purple-secondary/30" />
                    <Skeleton className="h-8 w-16 bg-vynal-purple-secondary/30" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-full bg-vynal-purple-secondary/30" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Main Content */}
          <Card className="dark:border-vynal-purple-secondary/40">
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-32 bg-vynal-purple-secondary/30" />
                <Skeleton className="h-8 w-24 bg-vynal-purple-secondary/30" />
              </div>
              
              {/* Activity List */}
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border dark:border-vynal-purple-secondary/30">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full bg-vynal-purple-secondary/30" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-48 bg-vynal-purple-secondary/30" />
                        <Skeleton className="h-3 w-24 bg-vynal-purple-secondary/30" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-16 rounded-md bg-vynal-purple-secondary/30" />
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              <div className="flex justify-center mt-4">
                <Skeleton className="h-8 w-48 bg-vynal-purple-secondary/30" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 