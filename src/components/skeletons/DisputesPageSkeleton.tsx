import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DisputesPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-white dark:bg-vynal-purple-dark/30 dark:border-vynal-purple-secondary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-7 w-12" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Card */}
      <Card className="bg-white dark:bg-vynal-purple-dark/30 dark:border-vynal-purple-secondary/20">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <div className="flex flex-col sm:flex-row gap-2">
              <Skeleton className="h-9 w-full sm:w-[200px]" />
              <Skeleton className="h-9 w-full sm:w-[180px]" />
            </div>
          </div>
        </CardHeader>
        
        {/* Tabs */}
        <div className="px-4 sm:px-6 mb-4">
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-16" />
            ))}
          </div>
        </div>
        
        {/* Disputes List */}
        <div className="px-4 sm:px-6 pb-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
} 