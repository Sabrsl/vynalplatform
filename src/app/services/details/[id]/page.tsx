"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

/**
 * Redirect handler to consolidate service detail pages
 * This page redirects users to the main service page route
 */
export default function ServiceDetailsRedirect() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const serviceId = params?.id;

  useEffect(() => {
    // Redirect to the main service page route using the ID
    if (serviceId) {
      console.log("Redirecting service details to main service page:", serviceId);
      router.replace(`/services/${serviceId}`);
    } else {
      // Fallback to services listing if no ID
      router.replace('/services');
    }
  }, [serviceId, router]);

  // Return nothing as we're redirecting
  return null;
} 