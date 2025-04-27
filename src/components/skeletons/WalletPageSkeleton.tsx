import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function WalletPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>
      
      {/* Wallet Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="dark:border-vynal-purple-secondary/40">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-8 w-36" />
            </CardHeader>
            <CardContent className="pb-2">
              <Skeleton className="h-4 w-48" />
            </CardContent>
            {i === 0 && (
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            )}
          </Card>
        ))}
      </div>
      
      {/* Transactions Card */}
      <Card className="dark:border-vynal-purple-secondary/40">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-1" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          {/* Tabs */}
          <div className="mb-4">
            <Skeleton className="h-10 w-72" />
          </div>
          
          {/* Search */}
          <div className="flex justify-end mb-4">
            <Skeleton className="h-10 w-64" />
          </div>
          
          {/* Transactions List */}
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex justify-between">
                    <div>
                      <Skeleton className="h-5 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 