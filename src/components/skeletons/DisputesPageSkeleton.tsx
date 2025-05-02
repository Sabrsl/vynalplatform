import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DisputesPageSkeleton() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-vynal-purple-dark flex flex-col items-center justify-start pt-6 animate-in fade-in">
      <div className="container mx-auto px-4 w-full max-w-6xl">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32 bg-vynal-purple-secondary/30" />
                      <Skeleton className="h-7 w-12 bg-vynal-purple-secondary/30" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-lg bg-vynal-purple-secondary/30" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                <Skeleton className="h-6 w-32 bg-vynal-purple-secondary/30" />
                <div className="flex flex-col sm:flex-row gap-2">
                  <Skeleton className="h-9 w-full sm:w-[200px] bg-vynal-purple-secondary/30" />
                  <Skeleton className="h-9 w-full sm:w-[180px] bg-vynal-purple-secondary/30" />
                </div>
              </div>
            </CardHeader>
            
            {/* Tabs */}
            <div className="px-4 sm:px-6 mb-4">
              <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-9 w-16 bg-vynal-purple-secondary/30" />
                ))}
              </div>
            </div>
            
            {/* Disputes List */}
            <div className="px-4 sm:px-6 pb-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full bg-vynal-purple-secondary/30" />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 