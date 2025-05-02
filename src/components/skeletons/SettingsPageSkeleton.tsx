import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SettingsPageSkeleton() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-vynal-purple-dark flex flex-col items-center justify-start pt-6 animate-in fade-in">
      <div className="container mx-auto px-4 w-full max-w-6xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2 mb-2">
              <Skeleton className="h-8 w-8 rounded-full bg-vynal-purple-secondary/30" />
              <Skeleton className="h-8 w-48 bg-vynal-purple-secondary/30" />
            </div>
            <Skeleton className="h-4 w-64 bg-vynal-purple-secondary/30" />
          </div>
          
          {/* Tab List */}
          <Skeleton className="h-10 w-full max-w-md bg-vynal-purple-secondary/30" />
          
          {/* Settings Cards */}
          <Card className="dark:border-vynal-purple-secondary/40">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-md bg-vynal-purple-secondary/30" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48 bg-vynal-purple-secondary/30" />
                  <Skeleton className="h-4 w-64 bg-vynal-purple-secondary/30" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Settings Fields */}
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col space-y-2">
                  <Skeleton className="h-5 w-32 bg-vynal-purple-secondary/30" />
                  <Skeleton className="h-10 w-full bg-vynal-purple-secondary/30" />
                </div>
              ))}
              
              <Skeleton className="h-10 w-32 mt-4 bg-vynal-purple-secondary/30" />
            </CardContent>
          </Card>
          
          <Card className="dark:border-vynal-purple-secondary/40">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-md bg-vynal-purple-secondary/30" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48 bg-vynal-purple-secondary/30" />
                  <Skeleton className="h-4 w-64 bg-vynal-purple-secondary/30" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Toggle Fields */}
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-vynal-purple-secondary/30">
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <Skeleton className="h-6 w-6 rounded-md mr-2 bg-vynal-purple-secondary/30" />
                      <Skeleton className="h-5 w-32 bg-vynal-purple-secondary/30" />
                    </div>
                    <Skeleton className="h-4 w-48 ml-8 bg-vynal-purple-secondary/30" />
                  </div>
                  <Skeleton className="h-6 w-12 rounded-full bg-vynal-purple-secondary/30" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 