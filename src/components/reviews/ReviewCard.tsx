import { Star } from 'lucide-react';
import Image from 'next/image';
import Script from 'next/script';
import { formatDate } from '@/lib/utils';

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    user: {
      name: string;
      image?: string;
    };
  };
}

export default function ReviewCard({ review }: ReviewCardProps) {
  // Données structurées pour l'avis
  const reviewJsonLd = {
    "@context": "https://schema.org",
    "@type": "Review",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": review.rating,
      "bestRating": 5
    },
    "author": {
      "@type": "Person",
      "name": review.user.name,
      "image": review.user.image
    },
    "datePublished": review.createdAt,
    "reviewBody": review.comment
  };

  return (
    <>
      <Script
        id={`review-jsonld-${review.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(reviewJsonLd)
        }}
      />
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-4 mb-4">
          {review.user.image ? (
            <Image
              src={review.user.image}
              alt={review.user.name}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
          )}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              {review.user.name}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(review.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center mb-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-5 h-5 ${
                i < review.rating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          ))}
        </div>
        <p className="text-gray-600 dark:text-gray-300">{review.comment}</p>
      </div>
    </>
  );
} 