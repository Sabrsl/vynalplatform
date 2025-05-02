import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function FinancesPageSkeleton() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-vynal-purple-dark flex flex-col items-center justify-start pt-6 animate-in fade-in">
      <div className="container mx-auto px-4 w-full max-w-6xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <Skeleton className="h-8 w-48 mb-2 bg-vynal-purple-secondary/30" />
              <Skeleton className="h-4 w-64 bg-vynal-purple-secondary/30" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-32 bg-vynal-purple-secondary/30" />
            </div>
          </div>
          
          {/* Finance Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="dark:border-vynal-purple-secondary/40">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24 bg-vynal-purple-secondary/30" />
                      <Skeleton className="h-7 w-16 bg-vynal-purple-secondary/30" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-lg bg-vynal-purple-secondary/30" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Tabs */}
          <Skeleton className="h-10 w-full max-w-lg mb-4 bg-vynal-purple-secondary/30" />
          
          {/* Transactions Table */}
          <Card className="dark:border-vynal-purple-secondary/40">
            <CardHeader>
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-48 bg-vynal-purple-secondary/30" />
                <Skeleton className="h-9 w-32 bg-vynal-purple-secondary/30" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Transaction Items */}
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full bg-vynal-purple-secondary/30" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-48 bg-vynal-purple-secondary/30" />
                      <Skeleton className="h-3 w-32 bg-vynal-purple-secondary/30" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Skeleton className="h-5 w-20 bg-vynal-purple-secondary/30" />
                    <Skeleton className="h-3 w-24 bg-vynal-purple-secondary/30" />
                  </div>
                </div>
              ))}
              
              {/* Pagination */}
              <div className="flex justify-center mt-6">
                <Skeleton className="h-8 w-48 bg-vynal-purple-secondary/30" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 