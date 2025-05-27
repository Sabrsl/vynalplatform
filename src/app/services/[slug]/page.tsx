import { Metadata } from "next";
import React, { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PUBLIC_ROUTES } from "@/config/routes";
import { getSupabaseServer } from "@/lib/supabase/server";
import ServiceView from "@/components/services/ServiceView";

// Configuration pour la génération statique
export const dynamic = "force-static";
export const revalidate = 604800; // 7 jours en secondes

// Métadonnées dynamiques pour la page
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const { slug } = params;
    const { data: service } = await getSupabaseServer()
      .from("services")
      .select("title, description")
      .eq("slug", slug)
      .single();

    if (service) {
      return {
        title: `${service.title} | Vynal Platform`,
        description: service.description.substring(0, 160),
      };
    }
  } catch (error) {
    console.error("Erreur lors de la génération des métadonnées:", error);
  }

  // Métadonnées par défaut
  return {
    title: "Service | Vynal Platform",
    description:
      "Découvrez ce service proposé par un freelance sur Vynal Platform",
  };
}

// Fonction pour charger les données du service côté serveur
async function getServiceData(slug: string) {
  try {
    const supabase = getSupabaseServer();

    if (!supabase) {
      throw new Error("Impossible d'initialiser le client Supabase");
    }

    // Récupération du service avec ses catégories et profil
    const { data: service, error } = await supabase
      .from("services")
      .select(
        `
        *,
        categories(*),
        profiles(*)
      `,
      )
      .eq("slug", slug)
      .single();

    if (error) {
      throw new Error("Service introuvable");
    }

    // Récupération des services connexes du même freelance en une seule requête
    const { data: relatedServices, error: relatedError } = await supabase
      .from("services")
      .select(
        `
        *,
        profiles (*),
        categories (*)
      `,
      )
      .eq("profiles.id", service.profiles.id)
      .eq("status", "approved")
      .eq("active", true)
      .neq("id", service.id)
      .limit(3);

    if (relatedError) {
      console.error(
        "Erreur lors de la récupération des services liés:",
        relatedError,
      );
    }

    // Normalisation du format des images
    const normalizedImages = Array.isArray(service.images)
      ? service.images
      : service.images
        ? [service.images]
        : [];

    return {
      service: {
        ...service,
        images: normalizedImages,
      },
      relatedServices: relatedServices || [],
    };
  } catch (error) {
    console.error("Erreur lors du chargement des données du service:", error);
    throw error;
  }
}

// Composant principal pour afficher le détail du service
async function ServiceDetailContent({ slug }: { slug: string }) {
  try {
    const { service, relatedServices } = await getServiceData(slug);

    return (
      <div className="min-h-screen bg-white dark:bg-vynal-purple-dark animate-in fade-in duration-300 service-detail-page stable-scroll">
        <main data-content="loaded">
          <div className="container mx-auto py-8 px-4 md:px-16 lg:px-24 xl:px-32 preserve-scroll">
            <div className="mb-6">
              <Link
                href={PUBLIC_ROUTES.SERVICES}
                className="inline-flex items-center text-vynal-title hover:text-vynal-accent-primary transition-colors text-[11px]"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Retour aux services
              </Link>
            </div>

            {service && (
              <div>
                <ServiceView
                  service={service}
                  loading={false}
                  error={null}
                  isFreelanceView={false}
                  relatedServices={relatedServices}
                  loadingRelated={false}
                  className="animate-in fade-in duration-300"
                />
              </div>
            )}
          </div>
        </main>
      </div>
    );
  } catch (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-vynal-purple-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-vynal-purple-secondary/10 rounded-lg p-6 text-center border border-red-100 dark:border-red-900/30">
          <div className="bg-red-50 dark:bg-red-900/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <ArrowLeft className="h-6 w-6 text-red-500 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-semibold mb-2 text-gray-800 dark:text-vynal-text-primary">
            Service introuvable
          </h1>
          <p className="text-gray-600 dark:text-vynal-text-secondary mb-4">
            Nous n'avons pas pu trouver le service que vous recherchez.
          </p>
          <Link href="/services">
            <div className="bg-vynal-accent-primary hover:bg-vynal-accent-primary/90 text-white py-2 px-4 rounded-md transition-colors inline-block">
              Retour aux services
            </div>
          </Link>
        </div>
      </div>
    );
  }
}

// Conteneur de chargement pour le Suspense
function ServiceDetailLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-vynal-purple-dark animate-in fade-in">
      <div className="container mx-auto px-4 w-full max-w-5xl py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-2/3">
            <Skeleton className="h-[400px] w-full mb-4 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton
                  key={i}
                  className="h-24 w-full bg-gray-100 dark:bg-vynal-purple-secondary/30"
                />
              ))}
            </div>
          </div>

          <div className="w-full md:w-1/3">
            <Skeleton className="h-8 w-3/4 mb-4 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
            <Skeleton className="h-6 w-1/2 mb-2 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
            <Skeleton className="h-32 w-full mb-6 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
            <Skeleton className="h-10 w-full mb-2 bg-gray-100 dark:bg-vynal-purple-secondary/30" />
            <Skeleton className="h-10 w-full bg-gray-100 dark:bg-vynal-purple-secondary/30" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Page principale avec Suspense boundary
export default function ServiceDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <Suspense fallback={<ServiceDetailLoading />}>
      <ServiceDetailContent slug={params.slug} />
    </Suspense>
  );
}
