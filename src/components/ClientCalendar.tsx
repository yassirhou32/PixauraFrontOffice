"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getUser } from "@/lib/auth";
import {
  CALENDAR_API_BASE,
  buildMonthCalendarGrid,
  monthLabelFr,
  getIsoWeekRef,
  isIsoWeekBlocked,
  isPastDateKey,
  profileFormulaLabel,
  type ClientWeekFormula,
  type MonthAvailabilityItem,
  type P2cQuotaInfo,
  weekKindLabel,
} from "@/lib/calendarClient";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function dayCellClass(
  cell: { inMonth: boolean; weekAllowed: boolean; availability?: MonthAvailabilityItem },
  selectedDate: string,
  dateKey: string
) {
  if (!cell.inMonth) {
    return "cursor-default border-transparent bg-transparent text-transparent";
  }
  if (cell.availability?.clientMonthClosed) {
    return "cursor-not-allowed border-zinc-800/90 bg-zinc-950/90 text-zinc-600";
  }
  if (isPastDateKey(dateKey)) {
    return "cursor-not-allowed border-zinc-800/90 bg-zinc-950/90 text-zinc-600";
  }
  if (cell.availability?.monthFullyBlocked || cell.availability?.p2cQuotaFull) {
    return "cursor-not-allowed border-zinc-800/90 bg-zinc-950/90 text-zinc-600";
  }
  if (cell.availability?.weekBlockedByP2c) {
    return "cursor-not-allowed border-zinc-700/80 bg-zinc-900/90 text-zinc-600 line-through decoration-zinc-600/50";
  }
  if (selectedDate === dateKey) {
    return "border-indigo-400 bg-indigo-500/40 text-white ring-2 ring-indigo-400/60";
  }
  if (!cell.weekAllowed || cell.availability?.selectable === false) {
    return "cursor-not-allowed border-zinc-700/80 bg-zinc-900/90 text-zinc-600 line-through decoration-zinc-600/50";
  }
  if (cell.availability?.fullDayBlocked) {
    return "cursor-not-allowed border-amber-600/50 bg-amber-950/50 text-amber-100";
  }
  if (cell.availability?.hasFreeSlot === false) {
    return "cursor-not-allowed border-amber-500/40 bg-amber-950/30 text-amber-50/90";
  }
  return "border-emerald-500/45 bg-emerald-950/25 text-white hover:border-emerald-400/60 hover:bg-emerald-900/35";
}

/** Grille mensuelle avec semaines ISO et indication paire / impaire. */
export default function ClientCalendar({
  token,
  selectedDate,
  onSelectDate,
  excludeRequestId,
}: {
  token: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  /** En modification : n’applique pas le quota P2C à cette demande (semaine courante dégrisée). */
  excludeRequestId?: string;
}) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [dates, setDates] = useState<MonthAvailabilityItem[]>([]);
  const [p2c, setP2c] = useState<P2cQuotaInfo | null>(null);
  const [clientMonthOpen, setClientMonthOpen] = useState(true);
  const [clientType, setClientType] = useState<ClientWeekFormula>("paire");

  useEffect(() => {
    const user = getUser();
    const t = user?.client?.clientType;
    if (t === "paire" || t === "impaire" || t === "vip") setClientType(t);
  }, []);

  useEffect(() => {
    if (!token) return;
    const q = new URLSearchParams({ month: String(month), year: String(year) });
    if (excludeRequestId) q.set("excludeRequestId", excludeRequestId);
    fetch(`${CALENDAR_API_BASE}/calendar/availability?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setDates(data.dates || []);
        setP2c(data.p2c || null);
        setClientMonthOpen(data.clientMonthOpen !== false);
      })
      .catch(() => {
        setDates([]);
        setP2c(null);
        setClientMonthOpen(true);
      });
  }, [month, year, token, excludeRequestId]);

  const weeks = useMemo(
    () => buildMonthCalendarGrid(year, month, dates, clientType),
    [year, month, dates, clientType]
  );

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="rounded-xl border border-violet-500/25 bg-violet-950/20 px-3 py-2.5 sm:px-4">
        <p className="text-[11px] font-semibold leading-snug text-violet-100 sm:text-xs">
          {profileFormulaLabel(clientType)}
        </p>
        {p2c ? (
          <p className="mt-2 text-[11px] leading-snug text-neutral-300 sm:text-xs">
            <span className="font-semibold text-white">P2C :</span> {p2c.usedThisMonth}/{p2c.maxPerMonth} projet
            {p2c.maxPerMonth > 1 ? "s" : ""} ce mois
            {p2c.remaining > 0 ? ` · ${p2c.remaining} restant${p2c.remaining > 1 ? "s" : ""}` : " · quota atteint"}
            {p2c.hasFullDayBooking && !excludeRequestId ? (
              <span className="text-zinc-400"> · journée complète ce mois : aucune autre date</span>
            ) : null}
            {p2c.canBookFullDay ? (
              <span className="text-emerald-200/90"> · journée complète possible (2 projets d’un coup)</span>
            ) : null}
            {excludeRequestId ? (
              <span className="text-violet-200/90"> · mode modification (votre semaine actuelle reste choisissable)</span>
            ) : null}
            {!excludeRequestId && p2c.blockedIsoWeeks.length > 0 ? (
              <> · semaine S.{p2c.blockedIsoWeeks[0].week} entièrement fermée (1ère demande)</>
            ) : null}
          </p>
        ) : null}
      </div>

      {!clientMonthOpen ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-950/30 px-3 py-2 text-xs text-amber-100">
          Ce mois n&apos;est pas encore ouvert à la réservation. Pixaura l&apos;activera lorsque les créneaux seront
          disponibles.
        </p>
      ) : null}

      <div className="flex min-w-0 items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white hover:bg-white/10"
          aria-label="Mois précédent"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="min-w-0 text-center font-mono text-sm font-bold uppercase tracking-wide text-white sm:text-base">
          {monthLabelFr(month, year)}
        </p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white hover:bg-white/10"
          aria-label="Mois suivant"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-2 sm:p-3">
        <div className="min-w-[min(100%,22rem)] sm:min-w-[28rem]">
          <div className="mb-1 grid grid-cols-[3.25rem_repeat(7,minmax(0,1fr))] gap-0.5 sm:grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] sm:gap-1">
            <div className="text-[9px] font-mono uppercase text-neutral-600 sm:text-[10px]">Sem.</div>
            {WEEKDAYS.map((wd) => (
              <div
                key={wd}
                className="py-1 text-center text-[9px] font-mono font-bold uppercase tracking-wide text-neutral-500 sm:text-[10px]"
              >
                {wd}
              </div>
            ))}
          </div>

          {weeks.map((row, wi) => {
            const iso = row.find((c) => c.inMonth)?.isoWeek ?? row[0].isoWeek;
            const allowed = row[0].weekAllowed;
            const kind = weekKindLabel(iso);
            const anchorDate = row.find((c) => c.inMonth)?.date ?? row[0].date;
            const weekRef = getIsoWeekRef(anchorDate);
            const p2cWeekBlocked = p2c ? isIsoWeekBlocked(weekRef, p2c.blockedIsoWeeks) : false;
            const rowOpen =
              allowed && !p2cWeekBlocked && !p2c?.monthFullyBlocked && !p2c?.quotaExhausted;

            return (
              <div
                key={`${iso}-${wi}`}
                className={cn(
                  "mb-1 grid grid-cols-[3.25rem_repeat(7,minmax(0,1fr))] gap-0.5 rounded-lg sm:grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] sm:gap-1",
                  rowOpen ? "bg-violet-500/5 ring-1 ring-violet-500/20" : "bg-zinc-950/40 ring-1 ring-zinc-800/80"
                )}
              >
                <div
                  className={cn(
                    "flex flex-col items-center justify-center rounded-l-md px-0.5 py-1 text-center sm:py-1.5",
                    rowOpen ? "text-violet-200" : "text-zinc-600"
                  )}
                >
                  <span className="text-[9px] font-mono font-bold sm:text-[10px]">S.{iso}</span>
                  <span
                    className={cn(
                      "mt-0.5 text-[8px] font-bold uppercase leading-tight sm:text-[9px]",
                      rowOpen ? "text-emerald-300/90" : "text-zinc-600"
                    )}
                  >
                    {kind}
                  </span>
                  {p2cWeekBlocked ? (
                    <span className="mt-0.5 text-[7px] uppercase leading-tight text-zinc-500">P2C</span>
                  ) : rowOpen ? (
                    <span className="mt-0.5 hidden text-[7px] uppercase text-violet-300/70 sm:block">OK</span>
                  ) : null}
                </div>

                {row.map((cell) => {
                  const dayNum = cell.date.getDate();
                  const past = isPastDateKey(cell.dateKey);
                  const clickable =
                    cell.inMonth &&
                    !past &&
                    cell.weekAllowed &&
                    cell.availability?.selectable !== false &&
                    !cell.availability?.fullDayBlocked &&
                    cell.availability?.hasFreeSlot !== false;

                  return (
                    <button
                      key={cell.dateKey}
                      type="button"
                      disabled={!clickable}
                      onClick={() => clickable && onSelectDate(cell.dateKey)}
                      className={cn(
                        "flex min-h-[2.25rem] flex-col items-center justify-center rounded-md border font-mono text-[11px] transition-colors sm:min-h-[2.5rem] sm:text-xs",
                        dayCellClass(cell, selectedDate, cell.dateKey)
                      )}
                      title={
                        !cell.inMonth
                          ? undefined
                          : past
                            ? "Date passée — non réservable"
                            : cell.availability?.monthFullyBlocked
                              ? "Journée complète ou quota mensuel atteint — plus de date ce mois"
                              : cell.availability?.p2cQuotaFull
                              ? "2 projets P2C déjà utilisés ce mois"
                              : cell.availability?.weekBlockedByP2c
                                ? "Semaine déjà utilisée pour votre 1re demande P2C"
                                : !cell.weekAllowed
                              ? `Semaine ${kind} — hors de votre formule`
                              : cell.availability?.fullDayBlocked
                                ? "Journée bloquée"
                                : cell.availability?.hasFreeSlot === false
                                  ? "Aucun créneau libre"
                                  : "Disponible — cliquez pour choisir"
                      }
                    >
                      {cell.inMonth ? (
                        <>
                          <span className="font-bold">{dayNum}</span>
                          {cell.weekAllowed &&
                          cell.availability?.hasFreeSlot &&
                          !cell.availability?.fullDayBlocked ? (
                            <span className="mt-0.5 hidden h-1 w-1 rounded-full bg-emerald-400 sm:block" />
                          ) : null}
                        </>
                      ) : (
                        <span className="opacity-0">0</span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <ul className="space-y-1.5 text-[10px] leading-relaxed text-neutral-400 sm:text-[11px]">
        <li>
          <span className="font-semibold text-violet-300">Semaine en violet</span> : votre formule (paire ou impaire)
          s&apos;applique — vous pouvez réserver.
        </li>
        <li>
          <span className="font-semibold text-zinc-500">Semaine grisée</span> : hors formule (autre parité ISO).
        </li>
        <li>
          <span className="font-semibold text-zinc-600">Jour gris foncé</span> : date passée ou semaine déjà utilisée (P2C).
        </li>
        <li>
          <span className="font-semibold text-white">P2C</span> : 2 projets max. / mois (créneau ou journée complète =
          2 projets), semaines différentes si 2 créneaux.
        </li>
        <li>
          <span className="inline-block h-2 w-2 rounded border border-emerald-500/50 bg-emerald-950/30 align-middle" />{" "}
          Jour avec créneau libre · <span className="text-amber-200/90">ambre</span> : complet ou bloqué
        </li>
        <li>
          Choisissez un jour vert, puis un créneau <strong className="text-neutral-200">sous le calendrier</strong>.
        </li>
      </ul>

      {!token ? <p className="text-sm text-amber-200">Session en cours de chargement…</p> : null}
    </div>
  );
}
