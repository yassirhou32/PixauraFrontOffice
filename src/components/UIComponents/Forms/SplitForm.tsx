"use client";

import React, { useState, useEffect } from "react";

export const LOGIN_SLIDER_IMAGES = [
  encodeURI("/images/Copie de LDP_5182.jpg"),
  encodeURI("/images/Copie de M7_00259.jpg"),
  encodeURI("/images/Copie de M7_03372.jpg"),
];

interface SplitFormProps {
  title?: string;
  subtitle?: string;
  formTitle?: string;
  emailLabel?: string;
  passwordLabel?: string;
  buttonText?: string;
  images?: string[];
  imageChangeInterval?: number;
  onSubmit?: (data: { email: string; password: string }) => void;
  maxWidth?: string;
  height?: string;
  backgroundColor?: string;
  leftPanelBgColor?: string;
  leftPanelTextColor?: string;
  leftPanelSubtitleColor?: string;
  imageOpacity?: number;
  imageScale?: number;
  indicatorActiveColor?: string;
  indicatorInactiveColor?: string;
  formTitleColor?: string;
  labelColor?: string;
  inputBgColor?: string;
  inputFocusBgColor?: string;
  inputFocusRingColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  className?: string;
  initialEmail?: string;
  initialPassword?: string;
  errorMessage?: string;
  /** Image plein écran derrière la carte (ex. page connexion uniquement) */
  fullPageBackgroundImage?: string;
}

export const SplitForm: React.FC<SplitFormProps> = ({
  title = "",
  subtitle = "",
  formTitle = "Log in to your account",
  emailLabel = "Email",
  passwordLabel = "Password",
  buttonText = "Sign In",
  images = LOGIN_SLIDER_IMAGES,
  imageChangeInterval = 3000,
  onSubmit,
  maxWidth = "72rem",
  height = "min(92vh, 680px)",
  backgroundColor = "#ffffff",
  leftPanelBgColor = "#000000",
  leftPanelTextColor = "#ffffff",
  leftPanelSubtitleColor = "#d1d5db",
  imageOpacity = 0.6,
  imageScale = 1.1,
  indicatorActiveColor = "#ffffff",
  indicatorInactiveColor = "rgba(255, 255, 255, 0.5)",
  formTitleColor = "#1f2937",
  labelColor = "#4b5563",
  inputBgColor = "#f9fafb",
  inputFocusBgColor = "#ffffff",
  inputFocusRingColor = "#000000",
  buttonBgColor = "#000000",
  buttonTextColor = "#ffffff",
  className = "",
  initialEmail = "",
  initialPassword = "",
  errorMessage,
  fullPageBackgroundImage,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, imageChangeInterval);
    return () => clearInterval(interval);
  }, [images.length, imageChangeInterval]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({ email, password });
  };

  const hasPageBg = Boolean(fullPageBackgroundImage);

  const inputClass = hasPageBg
    ? "w-full rounded-2xl border border-white/[0.12] bg-white/[0.04] p-[1.05rem] text-base text-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none backdrop-blur-md transition-all placeholder:text-neutral-500 focus:border-white/25 md:text-[1.05rem]"
    : "w-full rounded-xl border border-gray-200 p-4 text-base outline-none transition-all focus:border-transparent md:text-lg";

  const inputBgIdle = hasPageBg ? "rgba(255,255,255,0.05)" : inputBgColor;
  const inputBgFocus = hasPageBg ? "rgba(255,255,255,0.09)" : inputFocusBgColor;
  const inputRing = hasPageBg ? "rgba(255,255,255,0.22)" : inputFocusRingColor;

  const titleColor = hasPageBg ? "#ffffff" : formTitleColor;
  const labelColorResolved = hasPageBg ? "#e5e7eb" : labelColor;

  return (
    <div
      className={`relative flex min-h-screen w-full items-center justify-center p-6 sm:p-10 ${
        hasPageBg ? "text-white" : "bg-white text-black"
      }`}
    >
      {hasPageBg ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${fullPageBackgroundImage})` }}
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" aria-hidden />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(255,255,255,0.08),transparent_55%)]" aria-hidden />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_80%_100%,rgba(99,102,241,0.12),transparent_50%)]" aria-hidden />
        </>
      ) : null}
      <div
        className={`relative z-10 flex w-full flex-col overflow-hidden md:flex-row ${
          hasPageBg
            ? "rounded-[2rem] border border-white/[0.14] bg-white/[0.03] shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_40px_120px_-40px_rgba(0,0,0,0.65),0_0_100px_-50px_rgba(139,92,246,0.2)] backdrop-blur-[40px] backdrop-saturate-[1.35]"
            : "rounded-[1.75rem] shadow-2xl"
        } ${className}`}
        style={{
          maxWidth,
          height,
          backgroundColor: hasPageBg ? "rgba(255,255,255,0.02)" : backgroundColor,
        }}
      >
        <div
          className={`group relative flex flex-col justify-between overflow-hidden p-10 md:w-1/2 md:p-12 ${
            hasPageBg
              ? "border-b border-white/[0.08] bg-black/10 backdrop-blur-sm md:border-b-0 md:border-r md:border-white/[0.08]"
              : ""
          }`}
          style={{
            backgroundColor: hasPageBg ? "rgba(0,0,0,0.08)" : leftPanelBgColor,
            color: leftPanelTextColor,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- diaporama avec scale au survol comme le design source */}
          <img
            key={currentImageIndex}
            src={images[currentImageIndex]}
            alt=""
            className="absolute inset-0 z-0 h-full w-full object-cover transition-transform duration-700"
            style={{
              opacity: hasPageBg ? Math.min(imageOpacity + 0.12, 1) : imageOpacity,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = `scale(${imageScale})`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/75 via-black/15 to-transparent"
            aria-hidden
          />
          <div className="relative z-10 min-h-0 flex-1">
            {title ? <h3 className="text-4xl font-bold tracking-tight md:text-5xl">{title}</h3> : null}
            {subtitle ? (
              <p className="mt-3 text-lg md:text-xl" style={{ color: leftPanelSubtitleColor }}>
                {subtitle}
              </p>
            ) : null}
          </div>
          <div className="relative z-10 flex gap-2.5">
            {images.map((_, index) => (
              <div
                key={index}
                className="h-1.5 w-1.5 rounded-full border border-white/20 bg-white/10 shadow-sm backdrop-blur-sm transition-all duration-500 md:h-2 md:w-2"
                style={{
                  backgroundColor:
                    index === currentImageIndex ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.12)",
                  borderColor: index === currentImageIndex ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)",
                  boxShadow:
                    index === currentImageIndex
                      ? "0 0 20px rgba(255,255,255,0.35), inset 0 1px 0 rgba(255,255,255,0.5)"
                      : "none",
                  transform: index === currentImageIndex ? "scale(1.2)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>

        <div
          className={`relative flex flex-col justify-center p-10 md:w-1/2 md:p-14 lg:p-16 ${
            hasPageBg
              ? "border-white/[0.06] bg-white/[0.04] backdrop-blur-[32px] md:border-l md:border-white/[0.08]"
              : ""
          }`}
        >
          {hasPageBg ? (
            <>
              <div
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,rgba(255,255,255,0.06)_0%,transparent_45%,rgba(0,0,0,0.12)_100%)]"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
                aria-hidden
              />
            </>
          ) : null}
          <h4
            className={`relative mb-8 tracking-tight md:text-4xl ${hasPageBg ? "bg-gradient-to-br from-white via-white to-white/70 bg-clip-text text-3xl font-light text-transparent" : "text-3xl font-bold"}`}
            style={hasPageBg ? undefined : { color: titleColor }}
          >
            {formTitle}
          </h4>
          <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
            <div className="space-y-2">
              <label
                className={`text-xs font-semibold uppercase tracking-[0.2em] md:text-sm ${hasPageBg ? "text-neutral-400" : ""}`}
                style={hasPageBg ? undefined : { color: labelColorResolved }}
              >
                {emailLabel}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                style={{
                  backgroundColor: inputBgIdle,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.backgroundColor = inputBgFocus;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${inputRing}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.backgroundColor = inputBgIdle;
                  e.currentTarget.style.boxShadow = "";
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <label
                className={`text-xs font-semibold uppercase tracking-[0.2em] md:text-sm ${hasPageBg ? "text-neutral-400" : ""}`}
                style={hasPageBg ? undefined : { color: labelColorResolved }}
              >
                {passwordLabel}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                style={{
                  backgroundColor: inputBgIdle,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.backgroundColor = inputBgFocus;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${inputRing}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.backgroundColor = inputBgIdle;
                  e.currentTarget.style.boxShadow = "";
                }}
                required
              />
            </div>
            {errorMessage ? (
              <div
                role="alert"
                className={`rounded-2xl border px-4 py-3 text-sm font-medium leading-snug backdrop-blur-md ${
                  hasPageBg
                    ? "border-white/15 bg-red-500/[0.12] text-red-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {errorMessage}
              </div>
            ) : null}
            <button
              type="submit"
              className={`relative mt-2 w-full overflow-hidden rounded-2xl py-[1.05rem] text-base font-semibold tracking-wide transition-all md:text-lg ${
                hasPageBg
                  ? "border border-white/20 bg-gradient-to-r from-white/[0.14] via-indigo-500/25 to-violet-500/20 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_16px_48px_-20px_rgba(99,102,241,0.45)] backdrop-blur-md before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/10 before:to-transparent before:opacity-0 before:transition-opacity hover:border-white/30 hover:before:opacity-100 active:scale-[0.99]"
                  : "transition-opacity hover:opacity-80"
              }`}
              style={
                hasPageBg
                  ? undefined
                  : {
                      backgroundColor: buttonBgColor,
                      color: buttonTextColor,
                    }
              }
            >
              {buttonText}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
