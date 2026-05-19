import { apiFetch } from "@/lib/api";
import type { P2cQuotaInfo } from "@/lib/calendarClient";

export const P2C_COUNTING_STATUSES = ["en_attente", "validee", "a_completer"] as const;

export type P2cProjectSlotStatus = {
  submitted: boolean;
  requestId: string | null;
  editable: boolean;
  isFullDay: boolean;
};

export type P2cMonthStatus = {
  month: number;
  year: number;
  p2c: P2cQuotaInfo;
  project1: P2cProjectSlotStatus;
  project2: P2cProjectSlotStatus;
  canOpenProject1: boolean;
  canOpenProject2: boolean;
  prefillFromProject1: Record<string, string> | null;
  lockedProject1: Record<string, string> | null;
  lockedProject2: Record<string, string> | null;
};

type ClientRequestRow = {
  status?: string;
  p2cSlot?: number | null;
  requestedDate?: string;
  createdAt?: string;
  isFullDay?: boolean;
};

/** Mois civil du tournage à utiliser pour /p2c-status (évite de « perdre » le P1 après navigation). */
export function resolveP2cStatusMonth(requests: ClientRequestRow[]): { month: number; year: number } {
  const now = new Date();
  let month = now.getMonth() + 1;
  let year = now.getFullYear();

  const active = (requests || []).filter((r) =>
    P2C_COUNTING_STATUSES.includes(r.status as (typeof P2C_COUNTING_STATUSES)[number])
  );
  if (!active.length) return { month, year };

  const sorted = [...active].sort(
    (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
  );

  const p1 = sorted.find((r) => r.p2cSlot === 1) ?? sorted[0];
  const p2 = sorted.find((r) => r.p2cSlot === 2) ?? sorted[1];

  /** Mois du cycle : priorité au Projet 2 si les deux existent */
  const ref = p2?.requestedDate ? p2 : p1 && !p2 && !p1.isFullDay ? p1 : p1 || p2;
  if (ref?.requestedDate) {
    const d = new Date(ref.requestedDate);
    if (!Number.isNaN(d.getTime())) {
      month = d.getMonth() + 1;
      year = d.getFullYear();
    }
  }

  return { month, year };
}

/** Charge le statut P2C en s’appuyant d’abord sur /requests/me pour retrouver le bon mois. */
export async function fetchP2cPageStatus(token: string): Promise<P2cMonthStatus> {
  const me = await apiFetch<ClientRequestRow[]>("/requests/me", {}, token);
  const { month, year } = resolveP2cStatusMonth(Array.isArray(me) ? me : []);
  return apiFetch<P2cMonthStatus>(`/requests/p2c-status?month=${month}&year=${year}`, {}, token);
}
