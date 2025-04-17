"use client";

import React, { useState, useRef } from 'react';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function SpotlightCard({ children, className = '' }: SpotlightCardProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    
    // Calculate position relative to the card
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }

  function handleMouseEnter() {
    setIsHovering(true);
  }

  function handleMouseLeave() {
    setIsHovering(false);
  }

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Subtle border highlight on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          boxShadow: 'inset 0 0 0 1px rgba(255, 155, 255, 0.3)'
        }}
      />

      {/* Spotlight effect */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-500"
        style={{
          opacity: isHovering ? 1 : 0,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, 
                       rgba(255, 0, 255, 0.12), 
                       rgba(255, 105, 180, 0.08) 15%, 
                       rgba(255, 20, 147, 0.04) 30%, 
                       transparent 50%)`,
        }}
      />

      {/* Card content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
} 