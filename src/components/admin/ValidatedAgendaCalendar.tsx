"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { FALLBACK_DAY_SLOTS } from "@/lib/calendarClient";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

type ValidatedRequest = {
  _id: string;
  company: string;
  requestedDate: string;
  requestedTime: string;
  timeSlotId?: string;
  client?: { companyName?: string };
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function dateKeyFromDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function dateKeyFromIso(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatLongFrenchDate(dateKey: string): string {
  const [y, m, day] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, day);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dt);
}

function formatMonthYearFr(y: number, monthIndex: number): string {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(y, monthIndex, 1));
}

function slotMeta(r: ValidatedRequest): { end: Date; timeLabel: string; sortKey: string } {
  const dateKey = dateKeyFromIso(r.requestedDate);
  const [y, mo, d] = dateKey.split("-").map(Number);
  const slot = FALLBACK_DAY_SLOTS.find((s) => s.id === r.timeSlotId);
  if (slot) {
    const [eh, em] = slot.endTime.split(":").map(Number);
    const end = new Date(y, mo - 1, d, eh, em, 0, 0);
    return { end, timeLabel: `${slot.startTime} – ${slot.endTime}`, sortKey: slot.startTime };
  }
  const st = (r.requestedTime || "08:00").slice(0, 5);
  const [sh, sm] = st.split(":").map(Number);
  const start = new Date(y, mo - 1, d, sh, sm || 0, 0, 0);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return { end, timeLabel: `${st} (créneau)`, sortKey: st };
}

function companyName(r: ValidatedRequest) {
  return r.company || r.client?.companyName || "—";
}

export function ValidatedAgendaCalendar() {
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() };
  });
  const [items, setItems] = useState<ValidatedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clock, setClock] = useState(() => new Date());

  const { y, m } = cursor;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const from = `${y}-${pad2(m + 1)}-01`;
  const to = `${y}-${pad2(m + 1)}-${pad2(lastDay)}`;

  useEffect(() => {
    const token = getToken();
    if (!token) return undefined;
    let cancelled = false;
    const scheduleId = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      const q = new URLSearchParams({ status: "validee", from, to });
      apiFetch<ValidatedRequest[]>(`/requests?${q}`, {}, token)
        .then((data) => {
          if (!cancelled) setItems(data);
        })
        .catch((e) => {
          if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(scheduleId);
    };
  }, [from, to]);

  useEffect(() => {
    const id = window.setInterval(() => setClock(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const now = clock;

  const byDate = useMemo(() => {
    const map = new Map<string, ValidatedRequest[]>();
    for (const r of items) {
      const key = dateKeyFromIso(r.requestedDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    for (const list of map.values()) {
      list.sort((a, b) => slotMeta(a).sortKey.localeCompare(slotMeta(b).sortKey));
    }
    return map;
  }, [items]);

  const todayKey = dateKeyFromDate(clock);

  const cells = useMemo(() => {
    const first = new Date(y, m, 1);
    const firstMondayOffset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const out: { day: number | null; dateKey: string | null }[] = [];
    for (let i = 0; i < firstMondayOffset; i += 1) out.push({ day: null, dateKey: null });
    for (let d = 1; d <= daysInMonth; d += 1) {
      out.push({ day: d, dateKey: `${y}-${pad2(m + 1)}-${pad2(d)}` });
    }
    while (out.length % 7 !== 0) out.push({ day: null, dateKey: null });
    return out;
  }, [y, m]);

  const goPrev = () => setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }));
  const goNext = () => setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }));
  const goToday = () => {
    const n = new Date();
    setCursor({ y: n.getFullYear(), m: n.getMonth() });
  };

  return (
    <div className="flex flex-col gap-6 min-h-0">
      <header className="flex shrink-0 flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white md:text-4xl lg:text-5xl">
            Agenda validé
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-300 sm:text-base">
            Réservations confirmées par Pixaura : entreprise, date complète et créneau horaire. Les créneaux déjà passés
            apparaissent en rouge ; les rendez-vous à venir en vert.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 transition-colors hover:bg-white/10 sm:h-12 sm:w-12"
            aria-label="Mois précédent"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <div className="min-w-[200px] px-4 text-center text-base font-bold uppercase tracking-[0.12em] text-white sm:text-lg">
            {formatMonthYearFr(y, m)}
          </div>
          <button
            type="button"
            onClick={goNext}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 transition-colors hover:bg-white/10 sm:h-12 sm:w-12"
            aria-label="Mois suivant"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="ml-0 rounded-full border border-indigo-400/40 bg-indigo-500/15 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-indigo-100 transition-colors hover:bg-indigo-500/25 lg:ml-2"
          >
            Aujourd&apos;hui
          </button>
        </div>
      </header>

      {error && <p className="text-sm font-medium text-red-300 sm:text-base">{error}</p>}
      {loading && <p className="text-sm text-neutral-400 sm:text-base">Chargement…</p>}

      <div className="min-h-0 flex-1 overflow-auto rounded-3xl border border-white/10 bg-neutral-950/40 shadow-[0_8px_40px_-16px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <div className="min-w-[720px] p-4 md:p-6 lg:p-7">
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="bg-black/50 px-2 py-4 text-center text-xs font-bold uppercase tracking-[0.18em] text-neutral-300 sm:py-5 sm:text-sm"
              >
                {w}
              </div>
            ))}
            {cells.map((cell, idx) => {
              const list = cell.dateKey ? byDate.get(cell.dateKey) || [] : [];
              const isToday = cell.dateKey === todayKey;
              return (
                <div
                  key={idx}
                  className={cn(
                    "flex min-h-[128px] flex-col border-t border-white/5 bg-neutral-900/30 p-2.5 sm:min-h-[148px] md:min-h-[160px] md:p-3",
                    cell.day === null && "bg-black/20",
                    isToday && cell.day !== null && "bg-indigo-950/20 ring-1 ring-inset ring-indigo-400/50"
                  )}
                >
                  {cell.day !== null && (
                    <>
                      <div className="mb-2.5 flex items-start justify-between gap-1.5">
                        <span
                          className={cn(
                            "text-base font-bold tabular-nums sm:text-lg",
                            isToday ? "text-indigo-200" : "text-neutral-100"
                          )}
                        >
                          {cell.day}
                        </span>
                        {list.length > 0 && (
                          <span className="shrink-0 rounded-full border border-white/12 bg-white/5 px-2.5 py-0.5 text-[11px] font-bold uppercase text-neutral-300 sm:text-xs">
                            {list.length} {list.length === 1 ? "rdv" : "rdv"}
                          </span>
                        )}
                      </div>
                      <div className="scrollbar-thin flex max-h-[220px] flex-1 flex-col gap-2 overflow-y-auto md:max-h-[280px]">
                        {list.map((r) => {
                          const { end, timeLabel } = slotMeta(r);
                          const past = end.getTime() < now.getTime();
                          return (
                            <Link
                              key={r._id}
                              href={`/admin/demandes/${r._id}`}
                              className={cn(
                                "group block rounded-xl border px-3 py-2.5 transition-all hover:scale-[1.01] hover:shadow-lg sm:px-3.5 sm:py-3",
                                past
                                  ? "border-red-500/35 bg-red-950/40 text-red-100 hover:border-red-400/50"
                                  : "border-emerald-500/35 bg-emerald-950/35 text-emerald-50 hover:border-emerald-400/50"
                              )}
                            >
                              <div className="flex items-start justify-between gap-1.5">
                                <p className="line-clamp-2 text-sm font-bold leading-snug sm:text-[15px]">
                                  {companyName(r)}
                                </p>
                                <ChevronRight className="h-4 w-4 shrink-0 opacity-40 transition-opacity group-hover:opacity-100" />
                              </div>
                              <p className="mt-1.5 text-xs capitalize leading-snug opacity-90 sm:text-sm">
                                {cell.dateKey ? formatLongFrenchDate(cell.dateKey) : ""}
                              </p>
                              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold opacity-95 sm:text-sm">
                                <Clock className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                                {timeLabel}
                              </p>
                            </Link>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
