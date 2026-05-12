"use client";

import { useEffect, useState } from "react";
import { CALENDAR_API_BASE } from "@/lib/calendarClient";

type AvailabilityItem = {
  date: string;
  selectable: boolean;
  inProfile?: boolean;
  fullDayBlocked?: boolean;
  hasFreeSlot?: boolean;
};

function dayCellClass(d: AvailabilityItem, selectedDate: string) {
  if (selectedDate === d.date) {
    return "border-indigo-400 bg-indigo-500/30 text-white ring-1 ring-indigo-400/50";
  }
  if (!d.selectable) {
    return "cursor-not-allowed border-white/10 bg-zinc-900/80 text-zinc-500";
  }
  if (d.fullDayBlocked) {
    return "border-amber-500/50 bg-amber-950/35 text-amber-100 hover:bg-amber-950/50";
  }
  if (!d.hasFreeSlot) {
    return "border-amber-400/35 bg-amber-950/20 text-amber-50 hover:bg-amber-950/35";
  }
  return "border-white/25 bg-white/10 text-white hover:bg-white/20";
}

/** Grille du mois uniquement — date + créneaux sont gérés dans le formulaire parent (P2C). */
export default function ClientCalendar({
  token,
  selectedDate,
  onSelectDate,
}: {
  token: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [dates, setDates] = useState<AvailabilityItem[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${CALENDAR_API_BASE}/calendar/availability?month=${month}&year=${year}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setDates(data.dates || []))
      .catch(() => setDates([]));
  }, [month, year, token]);

  return (
    <div className="min-w-0 space-y-3 sm:space-y-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 sm:text-xs">Disponibilites du mois</p>
      <div className="flex min-w-0 flex-wrap gap-2">
        <input
          type="number"
          value={month}
          min={1}
          max={12}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="h-10 w-[4.25rem] min-w-0 rounded-lg border border-white/25 bg-black/50 px-2 text-sm text-white sm:w-20 sm:text-[15px]"
        />
        <input
          type="number"
          value={year}
          min={2024}
          max={2100}
          onChange={(e) => setYear(Number(e.target.value))}
          className="h-10 w-[4.5rem] min-w-0 rounded-lg border border-white/25 bg-black/50 px-2 text-sm text-white sm:w-24 sm:text-[15px]"
        />
      </div>
      <div className="grid min-w-0 grid-cols-2 gap-1.5 text-[10px] leading-tight sm:grid-cols-3 sm:gap-2 sm:text-xs md:grid-cols-4 lg:grid-cols-5">
        {dates.map((d) => (
          <button
            key={d.date}
            type="button"
            disabled={!d.selectable}
            onClick={() => onSelectDate(d.date)}
            className={`break-words rounded-lg border p-1.5 text-center font-mono transition-colors sm:p-2 ${dayCellClass(d, selectedDate)}`}
          >
            {d.date}
          </button>
        ))}
      </div>
      <p className="text-[11px] leading-relaxed text-neutral-400 sm:text-xs">
        <span className="text-zinc-500">Gris</span> : pas votre semaine (paire / impaire / VIP).{" "}
        <span className="text-amber-200/80">Ambre</span> : jour ouvrable — remplissez la date puis les créneaux{" "}
        <strong className="text-neutral-200">sous le calendrier</strong>.
      </p>
      {!token ? <p className="text-sm text-amber-200">Session en cours de chargement…</p> : null}
    </div>
  );
}
