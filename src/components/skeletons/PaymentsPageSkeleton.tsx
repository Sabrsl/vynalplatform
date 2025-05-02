import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function PaymentsPageSkeleton() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-vynal-purple-dark flex flex-col items-center justify-start pt-6 animate-in fade-in">
      <div className="container mx-auto px-4 w-full max-w-6xl">
        <div className="space-y-6">
          {/* Stats Cards Skeletons */}
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-32 bg-vynal-purple-secondary/30" />
                  <Skeleton className="h-8 w-40 mt-2 bg-vynal-purple-secondary/30" />
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Tabs and Content Skeletons */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <Skeleton className="h-10 w-96 bg-vynal-purple-secondary/30" />
              <Skeleton className="h-10 w-48 bg-vynal-purple-secondary/30" />
            </div>

            {/* Transactions Table Skeleton */}
            <Card>
              <div className="p-6 space-y-4">
                <Skeleton className="h-8 w-48 bg-vynal-purple-secondary/30" />
                
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full bg-vynal-purple-secondary/30" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-48 bg-vynal-purple-secondary/30" />
                          <Skeleton className="h-3 w-24 bg-vynal-purple-secondary/30" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-16 bg-vynal-purple-secondary/30" />
                        <Skeleton className="h-6 w-24 bg-vynal-purple-secondary/30" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 