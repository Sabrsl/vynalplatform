import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardPageSkeleton() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-vynal-purple-dark flex flex-col items-center justify-start pt-6 animate-in fade-in">
      <div className="container mx-auto px-4 w-full max-w-7xl">
        <div className="space-y-6">
          {/* En-tête du Dashboard */}
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-64 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
            <Skeleton className="h-8 w-32 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
          </div>
          
          {/* Statistiques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="dark:border-vynal-purple-secondary/40">
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <Skeleton className="h-8 w-8 rounded-full bg-gray-100 dark:bg-vynal-purple-secondary/30 mr-2" />
                    <Skeleton className="h-5 w-24 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <Skeleton className="h-7 w-16 mb-2 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                  <Skeleton className="h-4 w-24 rounded-md bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Section principale avec activités récentes et actions rapides */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Activités récentes */}
            <div className="md:col-span-7">
              <Card className="dark:border-vynal-purple-secondary/40">
                <CardHeader>
                  <div className="flex justify-between">
                    <div>
                      <Skeleton className="h-6 w-36 mb-2 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                      <Skeleton className="h-4 w-48 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start">
                      <Skeleton className="h-8 w-8 rounded-full bg-gray-100 dark:bg-vynal-purple-secondary/30 mr-3" />
                      <div className="space-y-2 flex-grow">
                        <Skeleton className="h-4 w-full bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                        <Skeleton className="h-3 w-24 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            
            {/* Actions rapides */}
            <div className="md:col-span-5 space-y-4">
              <Card className="dark:border-vynal-purple-secondary/40">
                <CardHeader>
                  <Skeleton className="h-6 w-36 mb-1 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                  <Skeleton className="h-4 w-48 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-lg bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="dark:border-vynal-purple-secondary/40">
                <CardHeader>
                  <Skeleton className="h-6 w-36 mb-1 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                  <Skeleton className="h-4 w-48 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-10 rounded-full bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                          <Skeleton className="h-3 w-24 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-16 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 