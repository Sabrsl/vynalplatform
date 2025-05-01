"use client";

import { memo, useMemo } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Database } from '@/types/database';
import { truncate } from '@/lib/utils';

// Custom type definition since 'freelances' doesn't exist in Database
export type FreelanceWithProfile = {
  id: string;
  title?: string;
  bio?: string;
  profiles: Database['public']['Tables']['profiles']['Row'];
  skills?: Array<{ name: string }>;
};

interface FreelanceCardProps {
  freelance: FreelanceWithProfile;
  priority?: boolean;
}

// Sous-composant mémoïsé pour l'avatar
const FreelanceAvatar = memo(({ 
  avatarUrl, 
  displayName, 
  priority 
}: { 
  avatarUrl?: string | null; 
  displayName: string; 
  priority: boolean; 
}) => (
  <Avatar className={`h-24 w-24 mb-4 ${priority ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}>
    <AvatarImage 
      src={avatarUrl || undefined} 
      alt={displayName} 
    />
    <AvatarFallback>
      {displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)}
    </AvatarFallback>
  </Avatar>
));

FreelanceAvatar.displayName = 'FreelanceAvatar';

// Sous-composant mémoïsé pour les compétences
const SkillsList = memo(({ skills }: { skills: Array<{ name: string }> }) => (
  <div className="mt-4 flex flex-wrap gap-1 justify-center">
    {skills.slice(0, 3).map((skill: { name: string }, index: number) => (
      <span 
        key={index} 
        className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full"
      >
        {skill.name}
      </span>
    ))}
    {skills.length > 3 && (
      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
        +{skills.length - 3}
      </span>
    )}
  </div>
));

SkillsList.displayName = 'SkillsList';

// Composant principal optimisé avec mémoisation
export const FreelanceCard = memo(function FreelanceCard({ 
  freelance, 
  priority = false 
}: FreelanceCardProps) {
  // Extractions et calculs mémoïsés pour éviter les recalculs
  const { profile, skills, displayName, profileUrl, bioText } = useMemo(() => {
    const profile = freelance.profiles;
    const skills = freelance.skills || [];
    const displayName = profile.username || profile.full_name || 'Anonyme';
    const profileUrl = `/freelances/${profile.username || freelance.id}`;
    const bioText = truncate(freelance.bio || 'Aucune biographie disponible.', 120);
    
    return { profile, skills, displayName, profileUrl, bioText };
  }, [freelance]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full transition-all hover:shadow-lg">
      <div className="p-6 flex flex-col items-center text-center flex-1">
        <FreelanceAvatar 
          avatarUrl={profile.avatar_url} 
          displayName={displayName} 
          priority={priority} 
        />
        
        <h3 className="font-semibold text-lg">{displayName}</h3>
        
        {priority && (
          <Badge variant="outline" className="mt-1 bg-indigo-50 text-indigo-700 border-indigo-200">
            Freelance Pro
          </Badge>
        )}
        
        <p className="text-gray-600 mt-2 font-medium">{freelance.title || 'Freelance'}</p>
        
        <p className="text-gray-500 text-sm mt-3 line-clamp-2">
          {bioText}
        </p>
        
        <SkillsList skills={skills} />
      </div>
      
      <div className="bg-gray-50 p-4 border-t border-gray-100">
        <Link
          href={profileUrl}
          className="block w-full py-2 text-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
        >
          Voir le profil
        </Link>
      </div>
    </div>
  );
}); 