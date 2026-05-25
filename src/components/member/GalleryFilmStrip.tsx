"use client";

import React, { memo } from "react";
import { cn } from "@/lib/utils";
import { MEMBER_LOGO_SOFT, MEMBER_STUDIO_IMAGES } from "@/lib/memberBrandAssets";

interface GalleryFilmStripProps {
  images?: readonly string[];
  backgroundColor?: string;
  borderColor?: string;
  className?: string;
}

const FilmFrame = memo(function FilmFrame({ src, eager }: { src: string; eager?: boolean }) {
  return (
    <div className="relative flex h-[96px] w-[150px] shrink-0 items-center justify-center rounded-sm bg-neutral-950 sm:h-[108px] sm:w-[170px] md:h-[132px] md:w-[210px] lg:h-[142px] lg:w-[228px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className="max-h-full max-w-full object-contain opacity-90"
      />
      <div className="pointer-events-none absolute -top-4 left-0 flex h-2.5 w-full justify-between px-1">
        {Array.from({ length: 5 }).map((_, j) => (
          <div key={j} className="h-2 w-1.5 rounded-sm bg-white/20" />
        ))}
      </div>
      <div className="pointer-events-none absolute -bottom-4 left-0 flex h-2.5 w-full justify-between px-1">
        {Array.from({ length: 5 }).map((_, j) => (
          <div key={j} className="h-2 w-1.5 rounded-sm bg-white/20" />
        ))}
      </div>
    </div>
  );
});

const GalleryFilmStrip: React.FC<GalleryFilmStripProps> = ({
  images = MEMBER_STUDIO_IMAGES,
  backgroundColor = "#111",
  borderColor = "#222",
  className,
}) => {
  const row = [...images, ...images];
  const rowReversed = [...images].reverse().concat([...images].reverse());

  return (
    <>
      <style jsx>{`
        @keyframes film-marquee-l {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-50%, 0, 0);
          }
        }
        @keyframes film-marquee-r {
          from {
            transform: translate3d(-50%, 0, 0);
          }
          to {
            transform: translate3d(0, 0, 0);
          }
        }
        .film-track-l {
          animation: film-marquee-l 36s linear infinite;
          will-change: transform;
        }
        .film-track-r {
          animation: film-marquee-r 36s linear infinite;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .film-track-l,
          .film-track-r {
            animation: none;
          }
        }
      `}</style>

      <div
        className={cn(
          "relative h-[272px] overflow-hidden sm:h-[292px] md:h-[318px] lg:h-[338px]",
          className
        )}
        style={{ backgroundColor }}
      >
        <div className="flex h-full flex-col justify-center gap-4 py-1 sm:gap-5 md:gap-6">
          <div
            className="w-full -rotate-2 bg-black py-2 shadow-lg sm:-rotate-[2.5deg] sm:py-2.5"
            style={{ borderTop: `5px solid ${borderColor}`, borderBottom: `5px solid ${borderColor}` }}
          >
            <div className="film-track-l flex w-max gap-4 sm:gap-5">
              {row.map((src, i) => (
                <FilmFrame key={`a-${i}`} src={src} eager={i < 3} />
              ))}
            </div>
          </div>

          <div
            className="z-10 w-full rotate-2 bg-black py-2 shadow-lg sm:rotate-[2.5deg] sm:py-2.5"
            style={{ borderTop: `5px solid ${borderColor}`, borderBottom: `5px solid ${borderColor}` }}
          >
            <div className="film-track-r flex w-max gap-4 sm:gap-5">
              {rowReversed.map((src, i) => (
                <FilmFrame key={`b-${i}`} src={src} eager={i < 3} />
              ))}
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/75 via-transparent to-black/75" />
        <div className="pointer-events-none absolute right-3 top-2.5 z-10 sm:right-4 sm:top-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={MEMBER_LOGO_SOFT}
            alt="Pixaura"
            className="h-7 w-auto max-w-[110px] object-contain opacity-90 sm:h-8"
          />
        </div>
      </div>
    </>
  );
};

export default GalleryFilmStrip;
