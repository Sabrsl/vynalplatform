"use client";

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BorderBeamButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function BorderBeamButton({ href, children, className }: BorderBeamButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const [{ x, y }, setPosition] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);
  
  // Pour éviter l'hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Gérer le mouvement de la souris sur le bouton
  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }

  if (!isMounted) {
    return (
      <Link
        href={href}
        className={cn(
          "border border-vynal-accent-primary text-vynal-accent-primary py-3 px-6 rounded-md font-medium hover:bg-vynal-accent-primary/10 transition-all",
          className
        )}
      >
        {children}
      </Link>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-md group">
      {/* Effet de bordure fine et lumineuse */}
      <div className="absolute inset-0 p-[1px] rounded-md overflow-hidden">
        <div className="absolute inset-0 rounded-md overflow-hidden z-0">
          {/* Première ligne horizontale (haut) */}
          <div
            className="absolute top-0 left-0 w-full h-[2px]"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, #ff71d4 50%, transparent 100%)',
              animation: 'moveRightToLeft 3s infinite linear',
              boxShadow: '0 0 10px rgba(255, 113, 212, 1)'
            }}
          />
          
          {/* Deuxième ligne horizontale (bas) */}
          <div
            className="absolute bottom-0 right-0 w-full h-[2px]"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, #ff52bf 50%, transparent 100%)',
              animation: 'moveLeftToRight 3s infinite linear',
              boxShadow: '0 0 10px rgba(255, 82, 191, 1)'
            }}
          />
          
          {/* Première ligne verticale (gauche) */}
          <div
            className="absolute top-0 left-0 h-full w-[2px]"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, #ff71d4 50%, transparent 100%)',
              animation: 'moveBottomToTop 3.5s infinite linear',
              boxShadow: '0 0 10px rgba(255, 113, 212, 1)'
            }}
          />
          
          {/* Deuxième ligne verticale (droite) */}
          <div
            className="absolute top-0 right-0 h-full w-[2px]"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, #ff52bf 50%, transparent 100%)',
              animation: 'moveTopToBottom 3.5s infinite linear',
              boxShadow: '0 0 10px rgba(255, 82, 191, 1)'
            }}
          />
        </div>
      </div>
      
      <Link
        ref={buttonRef}
        href={href}
        onMouseMove={handleMouseMove}
        className={cn(
          "relative block bg-vynal-purple-dark/90 text-vynal-accent-primary py-3 px-6 rounded-[3px] font-medium hover:text-white transition-all duration-300 z-10",
          className
        )}
      >
        {/* Beam effect on hover */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(120px circle at ${x}px ${y}px, rgba(255, 109, 196, 0.4), transparent 40%)`,
          }}
        />
        
        {/* Button content */}
        <span className="relative z-10">{children}</span>
      </Link>
      
      {/* Global CSS pour les animations */}
      <style jsx global>{`
        @keyframes moveRightToLeft {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes moveLeftToRight {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes moveTopToBottom {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes moveBottomToTop {
          0% { transform: translateY(100%); }
          100% { transform: translateY(-100%); }
        }
      `}</style>
    </div>
  );
} 