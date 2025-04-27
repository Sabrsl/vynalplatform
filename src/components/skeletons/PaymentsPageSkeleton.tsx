import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function PaymentsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeletons */}
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-40 mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Tabs and Content Skeletons */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-10 w-48" />
        </div>

        {/* Transactions Table Skeleton */}
        <Card>
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 