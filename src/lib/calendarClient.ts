export const CALENDAR_API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

/** Identifiant créneau « journée complète » (5 × 2 h, compte 2 projets P2C). */
export const FULL_DAY_SLOT_ID = "journee-complete";

export type ClientWeekFormula = "paire" | "impaire" | "vip";

export type MonthAvailabilityItem = {
  date: string;
  selectable: boolean;
  inProfile?: boolean;
  isPast?: boolean;
  weekBlockedByP2c?: boolean;
  p2cQuotaFull?: boolean;
  monthFullyBlocked?: boolean;
  fullDayBlocked?: boolean;
  hasFreeSlot?: boolean;
  fullDayAvailable?: boolean;
  /** Mois fermé par l'admin pour tous les clients */
  clientMonthClosed?: boolean;
};

export type IsoWeekRef = { isoWeekYear: number; week: number };

export type P2cQuotaInfo = {
  maxPerMonth: number;
  /** Poids consommé (1 = un créneau, 2 = journée complète) */
  usedThisMonth: number;
  remaining: number;
  requestCount?: number;
  blockedIsoWeeks: IsoWeekRef[];
  quotaExhausted: boolean;
  canBookFullDay?: boolean;
  hasFullDayBooking?: boolean;
  monthFullyBlocked?: boolean;
};

/** Année ISO + numéro de semaine ISO (aligné backend dayjs). */
export function getIsoWeekRef(date: Date): IsoWeekRef {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const isoWeekYear = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoWeekYear, 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { isoWeekYear, week };
}

export function isIsoWeekBlocked(ref: IsoWeekRef, blocked: IsoWeekRef[]): boolean {
  return blocked.some((b) => b.isoWeekYear === ref.isoWeekYear && b.week === ref.week);
}

/** Date YYYY-MM-DD strictement avant aujourd'hui (fuseau local navigateur). */
export function isPastDateKey(dateKey: string, now: Date = new Date()): boolean {
  const todayKey = formatDateKey(now);
  return dateKey < todayKey;
}

/** Numéro de semaine ISO (lundi = début de semaine). */
export function getIsoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function isEvenIsoWeek(isoWeek: number): boolean {
  return isoWeek % 2 === 0;
}

export function weekKindLabel(isoWeek: number): "Paire" | "Impaire" {
  return isEvenIsoWeek(isoWeek) ? "Paire" : "Impaire";
}

/** Même logique que le backend (calendarRules.isWeekRuleAllowed). */
export function isWeekAllowedForProfile(isoWeek: number, clientType: ClientWeekFormula): boolean {
  if (clientType === "vip") return true;
  const even = isEvenIsoWeek(isoWeek);
  if (clientType === "paire") return even;
  if (clientType === "impaire") return !even;
  return false;
}

export function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function mondayOnOrBefore(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = x.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + diff);
  return x;
}

export type CalendarCell = {
  dateKey: string;
  date: Date;
  inMonth: boolean;
  isoWeek: number;
  weekAllowed: boolean;
  availability?: MonthAvailabilityItem;
};

export function buildMonthCalendarGrid(
  year: number,
  month: number,
  availability: MonthAvailabilityItem[],
  clientType: ClientWeekFormula
): CalendarCell[][] {
  const byDate = new Map(availability.map((a) => [a.date, a]));
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  let monday = mondayOnOrBefore(first);
  const weeks: CalendarCell[][] = [];

  while (true) {
    const row: CalendarCell[] = [];
    for (let i = 0; i < 7; i++) {
      const cellDate = new Date(monday);
      cellDate.setDate(monday.getDate() + i);
      const dateKey = formatDateKey(cellDate);
      const iso = getIsoWeek(cellDate);
      row.push({
        dateKey,
        date: cellDate,
        inMonth: cellDate.getMonth() === month - 1,
        isoWeek: iso,
        weekAllowed: isWeekAllowedForProfile(iso, clientType),
        availability: byDate.get(dateKey),
      });
    }
    const hasInMonth = row.some((c) => c.inMonth);
    if (!hasInMonth && monday > last) break;
    weeks.push(row);
    monday.setDate(monday.getDate() + 7);
    if (monday > last && !hasInMonth) break;
  }

  return weeks;
}

const MONTH_NAMES_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export function monthLabelFr(month: number, year: number): string {
  return `${MONTH_NAMES_FR[month - 1] ?? ""} ${year}`;
}

export function profileFormulaLabel(clientType: ClientWeekFormula): string {
  if (clientType === "vip") return "Profil VIP — toutes les semaines sont ouvertes";
  if (clientType === "paire") return "Votre formule : semaines paires uniquement (numéro ISO pair)";
  return "Votre formule : semaines impaires uniquement (numéro ISO impair)";
}

export type DaySlot = {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  available: boolean;
  reason: string;
};

export const FALLBACK_DAY_SLOTS: DaySlot[] = [
  { id: "08-10", label: "08h00 - 10h00", startTime: "08:00", endTime: "10:00", available: false, reason: "erreur" },
  { id: "10-12", label: "10h00 - 12h00", startTime: "10:00", endTime: "12:00", available: false, reason: "erreur" },
  { id: "14-16", label: "14h00 - 16h00", startTime: "14:00", endTime: "16:00", available: false, reason: "erreur" },
  { id: "16-18", label: "16h00 - 18h00", startTime: "16:00", endTime: "18:00", available: false, reason: "erreur" },
  { id: "18-20", label: "18h00 - 20h00", startTime: "18:00", endTime: "20:00", available: false, reason: "erreur" },
];
