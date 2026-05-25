"use client";

import { useRef } from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = Omit<React.ComponentProps<"input">, "type">;

/**
 * Date admin sur fond sombre : icône calendrier blanche à droite (bouton + showPicker),
 * sans dépendre du pictogramme natif souvent illisible.
 */
export function AdminDateInput({ className, disabled, ...rest }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const el = ref.current;
    if (!el || disabled) return;
    if (typeof el.showPicker === "function") {
      void el.showPicker();
    } else {
      el.focus();
      el.click();
    }
  };

  return (
    <div
      className={cn(
        "flex min-w-[11rem] w-full max-w-full items-stretch overflow-hidden rounded-xl border border-white/15 bg-black/50",
        className
      )}
    >
      <input
        ref={ref}
        type="date"
        disabled={disabled}
        className={cn(
          "min-w-0 flex-1 rounded-none !border-0 bg-transparent py-3 pl-4 pr-2 text-base text-white outline-none",
          "focus:ring-0 [color-scheme:dark]",
          "[&::-webkit-calendar-picker-indicator]:h-0 [&::-webkit-calendar-picker-indicator]:w-0 [&::-webkit-calendar-picker-indicator]:p-0 [&::-webkit-calendar-picker-indicator]:opacity-0"
        )}
        {...rest}
      />
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        className="flex h-12 shrink-0 items-center justify-center border-l border-white/15 bg-white/5 px-4 text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Ouvrir le calendrier"
      >
        <CalendarDays className="h-5 w-5 sm:h-[22px] sm:w-[22px]" strokeWidth={1.75} />
      </button>
    </div>
  );
}
