"use client";

import React, { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ADMIN_DASHBOARD_IMAGES } from "@/lib/adminBrandAssets";

interface GalleryDiagonalMarqueeProps {
  backgroundColor?: string;
  className?: string;
}

function loopRow(images: readonly string[]) {
  return [...images, ...images];
}

const trackClass =
  "flex items-center gap-8 px-4 will-change-transform sm:gap-12 sm:px-6 md:gap-14 md:px-8";

const RectFrame = memo(function RectFrame({ src }: { src: string }) {
  return (
    <div className="relative h-36 w-56 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-neutral-950 shadow-lg sm:h-40 sm:w-64 md:h-44 md:w-72">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover object-center" />
    </div>
  );
});

const RoundFrame = memo(function RoundFrame({ src }: { src: string }) {
  return (
    <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-full border-[3px] border-white/25 bg-neutral-950 shadow-lg sm:h-48 sm:w-48 md:h-52 md:w-52">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover object-center" />
    </div>
  );
});

/** Répartition des 5 images sur les 3 bandes pour qu’elles défilent toutes */
const ROW1 = loopRow([ADMIN_DASHBOARD_IMAGES[0], ADMIN_DASHBOARD_IMAGES[1], ADMIN_DASHBOARD_IMAGES[2]]);
const ROW2 = loopRow([
  ADMIN_DASHBOARD_IMAGES[3],
  ADMIN_DASHBOARD_IMAGES[4],
  ADMIN_DASHBOARD_IMAGES[0],
  ADMIN_DASHBOARD_IMAGES[1],
]);
const ROW3 = loopRow([
  ADMIN_DASHBOARD_IMAGES[2],
  ADMIN_DASHBOARD_IMAGES[3],
  ADMIN_DASHBOARD_IMAGES[4],
  ADMIN_DASHBOARD_IMAGES[0],
  ADMIN_DASHBOARD_IMAGES[1],
]);

const GalleryDiagonalMarquee: React.FC<GalleryDiagonalMarqueeProps> = ({
  backgroundColor = "#0a0a0a",
  className,
}) => {
  return (
    <div
      className={cn(
        "relative w-full overflow-x-hidden py-8 sm:py-10 md:py-12",
        className
      )}
      style={{ backgroundColor }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-12 mix-blend-overlay" />

      <div className="flex flex-col items-center gap-7 sm:gap-9 md:gap-10">
        <div className="w-full max-w-[100vw] -rotate-[2deg]">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
            className={trackClass}
          >
            {ROW1.map((img, i) => (
              <RectFrame key={`r1-${i}`} src={img} />
            ))}
          </motion.div>
        </div>

        <div className="w-full max-w-[100vw] rotate-[2deg]">
          <motion.div
            animate={{ x: ["-50%", "0%"] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className={trackClass}
          >
            {ROW2.map((img, i) => (
              <RoundFrame key={`r2-${i}`} src={img} />
            ))}
          </motion.div>
        </div>

        <div className="w-full max-w-[100vw] -rotate-[1.5deg]">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
            className={trackClass}
          >
            {ROW3.map((img, i) => (
              <RectFrame key={`r3-${i}`} src={img} />
            ))}
          </motion.div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-black/45" />
    </div>
  );
};

export default GalleryDiagonalMarquee;
