"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import GalleryFilmStrip from "@/components/member/GalleryFilmStrip";
import { cn } from "@/lib/utils";
import {
  MEMBER_CONTACT_IMAGES,
  MEMBER_DEMANDES_IMAGES,
  MEMBER_LOGO_SOFT,
  MEMBER_STUDIO_IMAGES,
} from "@/lib/memberBrandAssets";

const HERO_SLIDE_MS = 5500;
const DEMANDES_SLIDE_MS = 5500;

function BrandImage({
  src,
  alt,
  className,
  priority,
  fit = "contain",
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  /** contain = image entière visible ; cover = remplissage (recadrage possible) */
  fit?: "contain" | "cover";
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn(
        "h-full w-full object-center",
        fit === "contain" ? "object-contain" : "object-cover",
        className
      )}
    />
  );
}

/** Bandeau photo seul + texte en dessous (hors cadre) — page P2C uniquement */
export function MemberP2cPageHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 space-y-4 sm:mb-7 sm:space-y-5", className)}>
      <GalleryFilmStrip className="rounded-3xl border border-white/10 shadow-[0_24px_60px_-32px_rgba(99,102,241,0.45)]" />
      <div className="max-w-3xl space-y-3 px-0.5 sm:space-y-4">
        {eyebrow ? (
          <p className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-violet-200/90 sm:text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            {eyebrow}
          </p>
        ) : null}
        <h2 className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-2xl font-black uppercase leading-[1.1] tracking-tight text-transparent sm:text-3xl md:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-neutral-300 sm:text-base">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Carrousel Mes demandes — boutons, auto-play, cadre premium */
export function MemberDemandesHero({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  const images = MEMBER_DEMANDES_IMAGES;
  const [index, setIndex] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [autoEpoch, setAutoEpoch] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % images.length) + images.length) % images.length);
      setAutoEpoch((e) => e + 1);
    },
    [images.length]
  );

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => (i + delta + images.length) % images.length);
      setAutoEpoch((e) => e + 1);
    },
    [images.length]
  );

  useEffect(() => {
    if (hoverPaused) return undefined;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, DEMANDES_SLIDE_MS);
    return () => window.clearInterval(id);
  }, [hoverPaused, autoEpoch, images.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  return (
    <div className={cn("space-y-5 sm:space-y-6", className)}>
      <div
        className="group relative overflow-hidden rounded-3xl border border-white/15 bg-neutral-950 shadow-[0_28px_64px_-28px_rgba(99,102,241,0.5)] ring-1 ring-violet-400/25"
        onMouseEnter={() => setHoverPaused(true)}
        onMouseLeave={() => setHoverPaused(false)}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          if (start == null) return;
          const dx = (e.changedTouches[0]?.clientX ?? start) - start;
          touchStartX.current = null;
          if (dx > 48) go(-1);
          else if (dx < -48) go(1);
        }}
      >
        <div className="pointer-events-none absolute inset-0 z-20 rounded-3xl ring-1 ring-inset ring-white/10" />

        <div className="relative aspect-[16/10] min-h-[220px] w-full bg-black sm:min-h-[260px] md:aspect-[16/9] md:min-h-[300px] lg:min-h-[340px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <BrandImage
                src={images[index]}
                alt={`Pixaura ${index + 1}`}
                fit="cover"
                className="h-full w-full"
                priority={index === 0}
              />
            </motion.div>
          </AnimatePresence>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

          <div className="absolute right-3 top-3 z-10 sm:right-5 sm:top-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={MEMBER_LOGO_SOFT}
              alt="Pixaura"
              className="h-8 w-auto max-w-[130px] object-contain opacity-95 drop-shadow-md sm:h-9"
            />
          </div>

          <button
            type="button"
            onClick={(e) => {
              go(-1);
              e.currentTarget.blur();
            }}
            aria-label="Image précédente"
            className="absolute left-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:border-violet-300/50 hover:bg-violet-950/70 sm:left-4 sm:h-12 sm:w-12"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              go(1);
              e.currentTarget.blur();
            }}
            aria-label="Image suivante"
            className="absolute right-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:border-violet-300/50 hover:bg-violet-950/70 sm:right-4 sm:h-12 sm:w-12"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
          </button>

          <div className="absolute bottom-3 left-0 right-0 z-30 flex justify-center gap-2 sm:bottom-4">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Aller à l'image ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                onClick={(e) => {
                  goTo(i);
                  e.currentTarget.blur();
                }}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === index ? "w-8 bg-white shadow-[0_0_12px_rgba(255,255,255,0.5)]" : "w-2 bg-white/40 hover:bg-white/70"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl space-y-3 sm:space-y-4">
        {eyebrow ? (
          <p className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-violet-200/90 sm:text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            {eyebrow}
          </p>
        ) : null}
        <h2 className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-2xl font-black uppercase leading-[1.1] tracking-tight text-transparent sm:text-3xl md:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-neutral-400 sm:text-base">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Bandeau simple (modifier) — sans pellicule */
export function MemberCinematicHero({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % MEMBER_STUDIO_IMAGES.length);
    }, HERO_SLIDE_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className={cn("space-y-5 sm:space-y-6", className)}>
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_24px_60px_-32px_rgba(99,102,241,0.4)]">
        <div className="relative w-full leading-[0]">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="relative w-full"
            >
              <BrandImage
                src={MEMBER_STUDIO_IMAGES[index]}
                alt="Pixaura"
                className="block h-auto max-h-[min(72vh,780px)] w-full"
                priority={index === 0}
              />
            </motion.div>
          </AnimatePresence>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute right-3 top-3 z-10 sm:right-5 sm:top-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={MEMBER_LOGO_SOFT}
              alt="Pixaura"
              className="h-8 w-auto max-w-[140px] object-contain opacity-95 sm:h-10"
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl space-y-3 sm:space-y-4">
        {eyebrow ? (
          <p className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-violet-200/90 sm:text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            {eyebrow}
          </p>
        ) : null}
        <h2 className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-2xl font-black uppercase leading-[1.1] tracking-tight text-transparent sm:text-3xl md:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-neutral-400 sm:text-base">{description}</p>
        ) : null}
        <div className="flex gap-2 pt-1">
          {MEMBER_STUDIO_IMAGES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Image ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === index ? "w-7 bg-white" : "w-2 bg-white/35 hover:bg-white/55"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Mosaïque + champs contact — formulaire P2C */
export function MemberContactPanel({
  children,
  className,
  compact,
}: {
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [mobileIndex, setMobileIndex] = useState(0);

  const desktopMosaicH = compact ? "h-[200px] lg:h-[240px]" : "h-[220px] lg:h-[280px]";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-950/30 via-black/50 to-indigo-950/20 ring-1 ring-white/10",
        className
      )}
    >
      <div
        className={cn(
          "grid min-w-0",
          compact ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
        )}
      >
        <div className={cn("flex flex-col border-b border-white/10 bg-black/40", !compact && "lg:border-b-0 lg:border-r")}>
          {/* Mobile : une grande image plein cadre (carrousel) */}
          <div className="relative md:hidden">
            <div className="relative aspect-[16/10] min-h-[220px] w-full overflow-hidden sm:min-h-[260px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mobileIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}
                  className="absolute inset-0"
                >
                  <BrandImage
                    src={MEMBER_CONTACT_IMAGES[mobileIndex]}
                    alt={`Pixaura ${mobileIndex + 1}`}
                    fit="cover"
                    className="h-full w-full"
                  />
                </motion.div>
              </AnimatePresence>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/15" />
            </div>
            <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-2">
              {MEMBER_CONTACT_IMAGES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Photo ${i + 1}`}
                  onClick={() => setMobileIndex(i)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    i === mobileIndex ? "w-7 bg-white" : "w-2 bg-white/40"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Desktop : 3 vignettes qui remplissent tout le cadre */}
          <div className={cn("relative hidden p-3 md:block lg:p-4", desktopMosaicH)}>
            <div className="grid h-full grid-cols-3 gap-2 lg:gap-3">
              {MEMBER_CONTACT_IMAGES.map((src, i) => (
                <motion.div
                  key={src}
                  className="relative h-full min-h-0 overflow-hidden rounded-xl bg-black"
                  onHoverStart={() => setHovered(i)}
                  onHoverEnd={() => setHovered(null)}
                  animate={{
                    scale: hovered === null ? 1 : hovered === i ? 1.03 : 0.97,
                    opacity: hovered === null ? 1 : hovered === i ? 1 : 0.75,
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <BrandImage src={src} alt={`Pixaura contact ${i + 1}`} fit="cover" className="absolute inset-0 h-full w-full" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                </motion.div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 bg-black/55 px-4 py-3 sm:px-5 sm:py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/90 sm:text-xs">
              Vos coordonnées
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-300 sm:text-sm">
              Renseignez l&apos;entreprise et le contact pour que Pixaura vous accompagne sur votre tournage.
            </p>
          </div>
        </div>
        <div className="min-w-0 p-4 sm:p-5 lg:p-6">{children}</div>
      </div>
    </div>
  );
}

/** Accent visuel sur une carte de demande */
export function MemberRequestCardVisual({ index }: { index: number }) {
  const src = MEMBER_STUDIO_IMAGES[index % MEMBER_STUDIO_IMAGES.length];
  return (
    <div className="relative flex w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/60 sm:w-52 md:w-56 lg:w-64">
      <div className="flex h-44 w-full items-center justify-center p-2 sm:h-52 md:h-56 lg:h-60">
        <BrandImage src={src} alt="" fit="contain" className="max-h-full max-w-full" />
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MEMBER_LOGO_SOFT} alt="" className="h-5 w-auto object-contain opacity-90 sm:h-6" />
      </div>
    </div>
  );
}

/** État vide — carrousel grand format sur mobile, grille sur desktop */
export function MemberEmptyStateVisual() {
  const images = MEMBER_DEMANDES_IMAGES;
  const [mobileIndex, setMobileIndex] = useState(0);
  const [autoEpoch, setMobileEpoch] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const goMobile = useCallback(
    (delta: number) => {
      setMobileIndex((i) => (i + delta + images.length) % images.length);
      setMobileEpoch((e) => e + 1);
    },
    [images.length]
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setMobileIndex((i) => (i + 1) % images.length);
    }, DEMANDES_SLIDE_MS);
    return () => window.clearInterval(id);
  }, [autoEpoch, images.length]);

  return (
    <div className="overflow-hidden rounded-2xl border border-dashed border-violet-400/25 bg-black">
      {/* Mobile : une grande image, swipe + auto */}
      <div className="md:hidden">
        <div
          className="relative min-h-[280px] w-full bg-neutral-950"
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const start = touchStartX.current;
            if (start == null) return;
            const dx = (e.changedTouches[0]?.clientX ?? start) - start;
            touchStartX.current = null;
            if (dx > 40) goMobile(-1);
            else if (dx < -40) goMobile(1);
          }}
        >
          <div className="relative flex min-h-[280px] items-center justify-center px-2 py-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={mobileIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="flex h-[min(52vw,320px)] w-full max-h-[320px] items-center justify-center"
              >
                <BrandImage
                  src={images[mobileIndex]}
                  alt=""
                  fit="contain"
                  className="max-h-full max-w-full"
                />
              </motion.div>
            </AnimatePresence>

            <button
              type="button"
              onClick={() => goMobile(-1)}
              aria-label="Image précédente"
              className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-sm"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => goMobile(1)}
              aria-label="Image suivante"
              className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-sm"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex justify-center gap-2 pb-3">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Image ${i + 1}`}
                onClick={() => {
                  setMobileIndex(i);
                  setMobileEpoch((e) => e + 1);
                }}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === mobileIndex ? "w-7 bg-violet-300" : "w-2 bg-white/35"
                )}
              />
            ))}
          </div>
        </div>

        <p className="border-t border-white/10 px-4 py-4 text-center text-sm leading-relaxed text-neutral-200">
          Votre première demande commence ici — l&apos;équipe Pixaura vous répond après envoi du formulaire P2C.
        </p>
      </div>

      {/* Desktop : grille inchangée */}
      <div className="relative hidden md:block">
        <div className="grid min-h-[280px] grid-cols-3 gap-3 p-3 lg:min-h-[300px]">
          {MEMBER_STUDIO_IMAGES.map((src) => (
            <div
              key={src}
              className="relative flex min-h-[240px] items-center justify-center overflow-hidden rounded-xl bg-black/50"
            >
              <BrandImage src={src} alt="" fit="contain" className="max-h-full max-w-full p-1 opacity-50" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 px-6 backdrop-blur-[1px]">
          <p className="max-w-md text-center text-base leading-relaxed text-neutral-100">
            Votre première demande commence ici — l&apos;équipe Pixaura vous répond après envoi du formulaire P2C.
          </p>
        </div>
      </div>
    </div>
  );
}
