"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { BentoGrid, BentoGridItem } from "./bento-grid";
import {
  IconBoxAlignRightFilled,
  IconClipboardCopy,
  IconFileBroken,
  IconSignature,
  IconTableColumn,
  IconSearch,
  IconUser,
  IconShieldCheck,
  IconCurrencyDollar,
  IconPackage
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import Image from "next/image";

const SkeletonOne = () => {
  const variants = {
    initial: {
      x: 0,
    },
    animate: {
      x: 10,
      rotate: 5,
      transition: {
        duration: 0.2,
      },
    },
  };
  const variantsSecond = {
    initial: {
      x: 0,
    },
    animate: {
      x: -10,
      rotate: -5,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.4] flex-col space-y-2"
    >
      <motion.div
        variants={variants}
        className="flex flex-row rounded-full border border-slate-300 dark:border-slate-700/30 p-2 items-center space-x-2 bg-white dark:bg-slate-900/30 backdrop-blur-sm hover:border-vynal-accent-primary/70 dark:hover:border-vynal-accent-secondary/50 hover:bg-white dark:hover:bg-slate-900/40 transition-all duration-200"
      >
        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary shrink-0 group-hover:scale-110 transition-transform duration-200" />
        <div className="w-full bg-slate-200 dark:bg-slate-800/30 h-4 rounded-full group-hover:bg-slate-300 dark:group-hover:bg-slate-700/30 transition-colors duration-200" />
      </motion.div>
      <motion.div
        variants={variantsSecond}
        className="flex flex-row rounded-full border border-slate-300 dark:border-slate-700/30 p-2 items-center space-x-2 w-3/4 ml-auto bg-white dark:bg-slate-900/30 backdrop-blur-sm hover:border-vynal-accent-primary/70 dark:hover:border-vynal-accent-secondary/50 hover:bg-white dark:hover:bg-slate-900/40 transition-all duration-200"
      >
        <div className="w-full bg-slate-200 dark:bg-slate-800/30 h-4 rounded-full group-hover:bg-slate-300 dark:group-hover:bg-slate-700/30 transition-colors duration-200" />
        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary shrink-0 group-hover:scale-110 transition-transform duration-200" />
      </motion.div>
      <motion.div
        variants={variants}
        className="flex flex-row rounded-full border border-slate-300 dark:border-slate-700/30 p-2 items-center space-x-2 bg-white dark:bg-slate-900/30 backdrop-blur-sm hover:border-vynal-accent-primary/70 dark:hover:border-vynal-accent-secondary/50 hover:bg-white dark:hover:bg-slate-900/40 transition-all duration-200"
      >
        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary shrink-0 group-hover:scale-110 transition-transform duration-200" />
        <div className="w-full bg-slate-200 dark:bg-slate-800/30 h-4 rounded-full group-hover:bg-slate-300 dark:group-hover:bg-slate-700/30 transition-colors duration-200" />
      </motion.div>
    </motion.div>
  );
};

const SkeletonTwo = () => {
  const variants = {
    initial: {
      width: 0,
    },
    animate: {
      width: "100%",
      transition: {
        duration: 0.2,
      },
    },
    hover: {
      width: ["0%", "100%"],
      transition: {
        duration: 2,
      },
    },
  };
  const arr = new Array(6).fill(0);
  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.4] flex-col space-y-2"
    >
      {arr.map((_, i) => (
        <motion.div
          key={"skelenton-two" + i}
          variants={variants}
          style={{
            maxWidth: Math.random() * (100 - 40) + 40 + "%",
          }}
          className="flex flex-row rounded-full border border-slate-300 dark:border-slate-700/30 p-2 items-center space-x-2 bg-slate-200 dark:bg-slate-800/30 w-full h-4 hover:border-vynal-accent-primary/70 dark:hover:border-vynal-accent-secondary/50 hover:bg-slate-300 dark:hover:bg-slate-700/30 transition-all duration-200"
        ></motion.div>
      ))}
    </motion.div>
  );
};

const SkeletonThree = () => {
  const variants = {
    initial: {
      backgroundPosition: "0 50%",
    },
    animate: {
      backgroundPosition: ["0, 50%", "100% 50%", "0 50%"],
    },
  };
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={variants}
      transition={{
        duration: 5,
        repeat: Infinity,
        repeatType: "reverse",
      }}
      className="rounded-xl p-4 bg-gradient-to-r from-vynal-accent-secondary to-vynal-accent-primary w-full h-32 flex items-center justify-center"
    >
      {/* Vous pouvez ajouter une icône ou laisser vide pour l'effet visuel */}
    </motion.div>
  );
};

const SkeletonFour = () => {
  const first = {
    initial: {
      x: 20,
      rotate: -5,
    },
    hover: {
      x: 0,
      rotate: 0,
    },
  };
  const second = {
    initial: {
      x: -20,
      rotate: 5,
    },
    hover: {
      x: 0,
      rotate: 0,
    },
  };
  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.4] flex-row space-x-2"
    >
      <motion.div
        variants={first}
        className="h-full w-1/3 rounded-2xl bg-white dark:bg-slate-900/30 backdrop-blur-sm p-4 border-2 dark:border-slate-700/30 border-slate-300 hover:border-vynal-accent-primary/70 dark:hover:border-vynal-accent-secondary/50 hover:bg-white dark:hover:bg-slate-900/40 transition-all duration-200 flex flex-col items-center justify-center"
      >
        <Image
          src="/images/profil1.webp"
          alt="avatar"
          width={40}
          height={40}
          className="rounded-full h-10 w-10"
        />
        <p className="sm:text-sm text-xs text-center font-poppins font-semibold text-neutral-600 mt-4">
        Jamais bloqué : si ça ne va pas, on vous rembourse
        </p>
        <p className="border-2 border-red-500 bg-red-200 dark:bg-red-800/40 text-red-700 dark:text-red-300 text-xs rounded-full px-2 py-0.5 mt-4 font-poppins">
         Remboursement
        </p>
      </motion.div>
      <motion.div className="h-full relative z-20 w-1/3 rounded-2xl bg-white dark:bg-slate-900/30 backdrop-blur-sm p-4 border-2 dark:border-slate-700/30 border-slate-300 hover:border-vynal-accent-primary/70 dark:hover:border-vynal-accent-secondary/50 hover:bg-white dark:hover:bg-slate-900/40 transition-all duration-200 flex flex-col items-center justify-center">
        <Image
          src="/images/profil2.webp"
          alt="avatar"
          width={96}
          height={112}
          className="rounded-full h-10 w-10 object-cover"
        />
        <p className="sm:text-sm text-xs text-center font-poppins font-semibold text-neutral-600 mt-4">
         Un souci ? On trouve une solution rapide et équitable
        </p>
        <p className="border-2 border-green-500 bg-green-200 dark:bg-green-800/40 text-green-700 dark:text-green-300 text-xs rounded-full px-2 py-0.5 mt-4 font-poppins">
         Assistance
        </p>
      </motion.div>
      <motion.div
        variants={second}
        className="h-full w-1/3 rounded-2xl bg-white dark:bg-slate-900/30 backdrop-blur-sm p-4 border-2 dark:border-slate-700/30 border-slate-300 hover:border-vynal-accent-primary/70 dark:hover:border-vynal-accent-secondary/50 hover:bg-white dark:hover:bg-slate-900/40 transition-all duration-200 flex flex-col items-center justify-center"
      >
        <Image
          src="/images/profil3.webp"
          alt="avatar"
          width={96}
          height={112}
          className="rounded-full h-10 w-10 object-cover"
        />
        <p className="sm:text-sm text-xs text-center font-poppins font-semibold text-neutral-600 mt-4">
         Commandez l'esprit tranquille : satisfait ou remboursé
        </p>
        <p className="border-2 border-orange-500 bg-orange-200 dark:bg-orange-800/40 text-orange-700 dark:text-orange-300 text-xs rounded-full px-2 py-0.5 mt-4 font-poppins">
         Satisfaction
        </p>
      </motion.div>
    </motion.div>
  );
};

const SkeletonFive = () => {
  const variants = {
    initial: {
      x: 0,
    },
    animate: {
      x: 10,
      rotate: 5,
      transition: {
        duration: 0.2,
      },
    },
  };
  const variantsSecond = {
    initial: {
      x: 0,
    },
    animate: {
      x: -10,
      rotate: -5,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex flex-1 w-full h-full min-h-[6rem] dark:bg-dot-white/[0.2] bg-dot-black/[0.4] flex-col space-y-2"
    >
      <motion.div
        variants={variants}
        className="flex flex-row rounded-2xl border-2 border-slate-300 dark:border-slate-700/30 p-2 items-start space-x-2 bg-white dark:bg-slate-900/30 backdrop-blur-sm hover:border-vynal-accent-primary/70 dark:hover:border-vynal-accent-secondary/50 hover:bg-white dark:hover:bg-slate-900/40 transition-all duration-200"
      >
        <Image
          src="/images/profil4.webp"
          alt="avatar"
          width={40}
          height={40}
          className="rounded-full h-10 w-10"
        />
        <p className="text-xs text-neutral-600 font-poppins">
          Bonjour Mme Ba, je viens de terminer votre projet,
          je vous livre votre commande ....
        </p>
      </motion.div>
      <motion.div
        variants={variantsSecond}
        className="flex flex-row rounded-full border-2 border-slate-300 dark:border-slate-700/30 p-2 items-center justify-end space-x-2 w-3/4 ml-auto bg-white dark:bg-slate-900/30 backdrop-blur-sm hover:border-vynal-accent-primary/70 dark:hover:border-vynal-accent-secondary/50 hover:bg-white dark:hover:bg-slate-900/40 transition-all duration-200"
      >
        <p className="text-xs text-neutral-600 font-poppins">Bonjour, Excellent, je reste en attente.</p>
        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary shrink-0" />
      </motion.div>
    </motion.div>
  );
};

const items = [
  {
    title: "Trouvez le service qu'il vous faut",
    description: (
      <span className="text-sm text-slate-600">
        Parcourez des centaines de services proposés par des freelances qualifiés.
      </span>
    ),
    header: <SkeletonOne />,
    className: "md:col-span-1 bg-white/30 border border-slate-200",
    icon: <IconSearch className="h-3 w-3 text-vynal-accent-primary" />,
  },
  {
    title: "Choisissez le bon freelance",
    description: (
      <span className="text-sm text-slate-600">
        Consultez les avis, les profils, écrivez au freelance pour faire le bon choix.
      </span>
    ),
    header: <SkeletonTwo />,
    className: "md:col-span-1 bg-white/30 border border-slate-200",
    icon: <IconUser className="h-3 w-3 text-vynal-accent-primary" />,
  },
  {
    title: "Commandez en toute sécurité",
    description: (
      <span className="text-sm text-slate-600">
        Paiement sécurisé, débloqué seulement quand le travail est terminé et validé.
      </span>
    ),
    header: <SkeletonThree />,
    className: "md:col-span-1 bg-white/30 border border-slate-200",
    icon: <IconShieldCheck className="h-3 w-3 text-vynal-accent-primary" />,
  },
  {
    title: "Garantie satisfait ou remboursé",
    description: (
      <span className="text-sm text-slate-600">
        En cas de souci, vous êtes remboursé. Simple et sans stress.
      </span>
    ),
    header: <SkeletonFour />,
    className: "md:col-span-2 bg-white/30 border border-slate-200",
    icon: <IconCurrencyDollar className="h-3 w-3 text-vynal-accent-primary" />,
  },
  {
    title: "Suivi clair et rapide",
    description: (
      <span className="text-sm text-slate-600">
        Suivez chaque étape de votre commande en toute transparence.
      </span>
    ),
    header: <SkeletonFive />,
    className: "md:col-span-1 bg-white/30 border border-slate-200",
    icon: <IconPackage className="h-3 w-3 text-vynal-accent-primary" />,
  },
];

export function BentoGridThirdDemo() {
  return (
    <BentoGrid className="max-w-4xl mx-auto md:auto-rows-[20rem]">
      {items.map((item, i) => (
        <BentoGridItem
          key={i}
          title={item.title}
          description={item.description}
          header={item.header}
          className={cn("[&>p:text-xl] [&>p:font-semibold] [&>p:text-slate-800]", item.className)}
          icon={item.icon}
        />
      ))}
    </BentoGrid>
  );
}