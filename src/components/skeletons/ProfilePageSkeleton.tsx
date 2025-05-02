import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfilePageSkeleton() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-vynal-purple-dark flex flex-col items-center justify-start pt-6 animate-in fade-in">
      <div className="container mx-auto px-4 w-full max-w-6xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48 bg-vynal-purple-secondary/30" />
            <Skeleton className="h-8 w-32 bg-vynal-purple-secondary/30" />
          </div>
          
          {/* Profil principal */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Section d'informations principales */}
            <div className="md:col-span-7">
              <Card className="dark:border-vynal-purple-secondary/40">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-20 w-20 rounded-full bg-vynal-purple-secondary/30" />
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-48 bg-vynal-purple-secondary/30" />
                      <Skeleton className="h-4 w-32 bg-vynal-purple-secondary/30" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Champs du formulaire */}
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-32 bg-vynal-purple-secondary/30" />
                      <Skeleton className="h-10 w-full bg-vynal-purple-secondary/30 rounded-md" />
                    </div>
                  ))}
                  
                  {/* Bio */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32 bg-vynal-purple-secondary/30" />
                    <Skeleton className="h-28 w-full bg-vynal-purple-secondary/30 rounded-md" />
                  </div>
                  
                  {/* Bouton de sauvegarde */}
                  <Skeleton className="h-10 w-32 bg-vynal-purple-secondary/30 rounded-md mt-4" />
                </CardContent>
              </Card>
            </div>
            
            {/* Section latérale */}
            <div className="md:col-span-5 space-y-6">
              {/* Card d'informations */}
              <Card className="dark:border-vynal-purple-secondary/40">
                <CardHeader>
                  <Skeleton className="h-6 w-36 bg-vynal-purple-secondary/30" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full bg-vynal-purple-secondary/30" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-3/4 bg-vynal-purple-secondary/30" />
                        <Skeleton className="h-3 w-1/2 bg-vynal-purple-secondary/30" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              {/* QR Code */}
              <Card className="dark:border-vynal-purple-secondary/40">
                <CardHeader>
                  <Skeleton className="h-6 w-36 bg-vynal-purple-secondary/30" />
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <Skeleton className="h-40 w-40 bg-vynal-purple-secondary/30 mb-4" />
                  <Skeleton className="h-10 w-40 bg-vynal-purple-secondary/30 rounded-md" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 