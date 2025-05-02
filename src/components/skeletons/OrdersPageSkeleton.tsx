import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function OrdersPageSkeleton() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-vynal-purple-dark flex flex-col items-center justify-start pt-6 animate-in fade-in">
      <div className="container mx-auto px-4 w-full max-w-7xl">
        <div className="space-y-6">
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <Skeleton className="h-7 w-48 mb-2 bg-vynal-purple-secondary/30" />
              <Skeleton className="h-4 w-64 bg-vynal-purple-secondary/30" />
            </div>
            
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24 rounded-md bg-vynal-purple-secondary/30" />
              <Skeleton className="h-4 w-36 bg-vynal-purple-secondary/30" />
            </div>
          </div>

          {/* Cards statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="dark:border-vynal-purple-secondary/20">
                <CardContent className="p-3 sm:p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <Skeleton className="h-4 w-32 mb-2 bg-vynal-purple-secondary/30" />
                      <Skeleton className="h-7 w-16 bg-vynal-purple-secondary/30" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-lg bg-vynal-purple-secondary/30" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Liste des commandes */}
          <Card className="dark:border-vynal-purple-secondary/20">
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                <Skeleton className="h-6 w-36 bg-vynal-purple-secondary/30" />
                <div className="flex flex-col sm:flex-row gap-2">
                  <Skeleton className="h-9 w-48 rounded-md bg-vynal-purple-secondary/30" />
                  <Skeleton className="h-9 w-9 rounded-md bg-vynal-purple-secondary/30" />
                </div>
              </div>
            </CardHeader>
            
            {/* Tabs */}
            <div className="px-4 sm:px-6">
              <Skeleton className="h-9 w-full max-w-3xl mb-4 bg-vynal-purple-secondary/30" />
            </div>
            
            <CardContent>
              {/* Cards des commandes */}
              <div className="grid grid-cols-1 gap-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg bg-vynal-purple-secondary/30" />
                ))}
              </div>
              
              {/* Pagination */}
              <div className="flex justify-center mt-6">
                <Skeleton className="h-9 w-56 bg-vynal-purple-secondary/30" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 