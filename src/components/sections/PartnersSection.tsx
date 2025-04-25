"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, useAnimation } from "framer-motion";

const PartnersSection = () => {
  const [isPaused, setIsPaused] = useState(false);
  const controls = useAnimation();

  const partners = [
    { name: "Wave", image: "/assets/partners/logo_wave_.webp" },
    { name: "Orange Money", image: "/assets/partners/om_logo_.webp" },
    { name: "Free Money", image: "/assets/partners/logo_free_money.webp" },
    { name: "Stripe", image: "/assets/partners/logo_stripe.webp" },
  ];

  // Multiple copies for a smoother infinite loop
  const duplicatedPartners = [...partners, ...partners, ...partners, ...partners, ...partners];

  const handlePause = () => {
    if (isPaused) {
      controls.start({
        x: [null, -2400],
        transition: {
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 40,
            ease: "linear",
          }
        }
      });
    } else {
      controls.stop();
    }
    setIsPaused(!isPaused);
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 overflow-hidden bg-vynal-purple-dark/50 w-screen relative -mx-4 md:-mx-8 lg:-mx-12">
      <div className="container mx-auto px-4 mb-8 sm:mb-10 md:mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-vynal-text-primary bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary bg-clip-text text-transparent">
          Ils nous font confiance
        </h2>
      </div>
      
      {/* Single row with full width */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute left-0 w-16 sm:w-24 md:w-32 h-full bg-gradient-to-r from-vynal-purple-dark/95 to-transparent z-10" />
        <div className="absolute right-0 w-16 sm:w-24 md:w-32 h-full bg-gradient-to-l from-vynal-purple-dark/95 to-transparent z-10" />
        
        <motion.div 
          className="flex gap-14 sm:gap-16 md:gap-20 py-4 whitespace-nowrap cursor-pointer"
          animate={controls}
          initial={{
            x: 0,
          }}
          onHoverStart={handlePause}
          onHoverEnd={handlePause}
          onViewportEnter={() => {
            controls.start({
              x: [0, -2400],
              transition: {
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 25,
                  ease: "linear",
                }
              }
            });
          }}
        >
          {duplicatedPartners.map((partner, index) => (
            <div key={`${partner.name}-${index}`} className="inline-block">
              <div className="w-24 sm:w-28 md:w-32 h-20 sm:h-22 md:h-24 relative flex items-center justify-center">
                <Image
                  src={partner.image}
                  alt={partner.name}
                  width={100}
                  height={70}
                  className="h-auto w-auto object-contain max-h-full max-w-full transition-all duration-300 hover:opacity-100 hover:scale-105 select-none filter hue-rotate-275 brightness-100 contrast-100 opacity-85"
                />
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PartnersSection; 