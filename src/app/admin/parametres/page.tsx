/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { AdminY2KLayout, ChromeCard } from "@/components/admin/Y2KAdminLayout";
import { AdminDateInput } from "@/components/admin/AdminDateInput";
import { cn } from "@/lib/utils";

const inputClass =
  "h-12 w-full rounded-xl border border-white/15 bg-black/50 px-4 text-base text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-violet-400/55 focus:ring-2 focus:ring-violet-500/20";

const labelClass = "text-xs font-semibold uppercase tracking-[0.12em] text-neutral-300 sm:text-sm";

const btnPrimaryClass =
  "rounded-xl border border-white/15 bg-neutral-900 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-neutral-800";

const btnActionBaseClass =
  "rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors sm:text-base";

type AdminSlot = {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  adminBlocked: boolean;
  blockedSlotId: string | null;
  bookings: { requestId: string; clientId: string; company: string }[];
  free: boolean;
};

type BlockedSlotRow = {
  _id: string;
  date: string;
  slotId: string;
  slotLabel: string;
  reason: string;
};

type ClientMonthAccessItem = {
  year: number;
  month: number;
  label: string;
  openForClients: boolean;
  isCurrentMonth: boolean;
  recordId: string | null;
};

export default function ParametresPage() {
  const router = useRouter();
  const [blocked, setBlocked] = useState<any[]>([]);
  const [blockedSlotsList, setBlockedSlotsList] = useState<BlockedSlotRow[]>([]);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("jour férié");
  const [dayEdit, setDayEdit] = useState("");
  const [daySlots, setDaySlots] = useState<AdminSlot[]>([]);
  const [fullDayBlocked, setFullDayBlocked] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);
  const [monthAccess, setMonthAccess] = useState<ClientMonthAccessItem[]>([]);
  const [loadingMonths, setLoadingMonths] = useState(false);

  const load = async () => {
    const token = getToken();
    const days = await apiFetch<any[]>("/calendar/blocked", {}, token);
    setBlocked(days);
    try {
      const slots = await apiFetch<BlockedSlotRow[]>("/calendar/blocked-slots", {}, token);
      setBlockedSlotsList(slots);
    } catch {
      setBlockedSlotsList([]);
    }
    setLoadingMonths(true);
    try {
      const months = await apiFetch<{ items: ClientMonthAccessItem[] }>(
        "/calendar/client-month-access?count=12",
        {},
        token
      );
      setMonthAccess(months.items || []);
    } catch {
      setMonthAccess([]);
    } finally {
      setLoadingMonths(false);
    }
  };

  async function setMonthOpen(year: number, month: number, openForClients: boolean) {
    const token = getToken();
    await apiFetch(
      "/calendar/client-month-access",
      { method: "PUT", body: JSON.stringify({ year, month, openForClients }) },
      token
    );
    await load();
  }

  const loadDaySlots = async (d: string) => {
    if (!d) {
      setDaySlots([]);
      setFullDayBlocked(false);
      return;
    }
    setLoadingDay(true);
    try {
      const token = getToken();
      const data = await apiFetch<{ slots: AdminSlot[]; fullDayBlocked: boolean }>(
        `/calendar/admin/day-slots?date=${encodeURIComponent(d)}`,
        {},
        token
      );
      setDaySlots(data.slots || []);
      setFullDayBlocked(!!data.fullDayBlocked);
    } catch {
      setDaySlots([]);
      setFullDayBlocked(false);
    } finally {
      setLoadingDay(false);
    }
  };

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "admin") return router.push("/login");
    load();
  }, [router]);

  useEffect(() => {
    loadDaySlots(dayEdit);
  }, [dayEdit]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const token = getToken();
    await apiFetch("/calendar/blocked", { method: "POST", body: JSON.stringify({ date, reason }) }, token);
    setDate("");
    setReason("jour férié");
    await load();
    if (dayEdit === date) await loadDaySlots(dayEdit);
  }

  async function remove(id: string) {
    const token = getToken();
    await apiFetch(`/calendar/blocked/${id}`, { method: "DELETE" }, token);
    await load();
    await loadDaySlots(dayEdit);
  }

  async function blockSlot(slotId: string) {
    const token = getToken();
    await apiFetch(
      "/calendar/blocked-slots",
      { method: "POST", body: JSON.stringify({ date: dayEdit, slotId, reason: "admin" }) },
      token
    );
    await loadDaySlots(dayEdit);
    await load();
  }

  async function unblockSlot(blockedSlotId: string) {
    const token = getToken();
    await apiFetch(`/calendar/blocked-slots/${blockedSlotId}`, { method: "DELETE" }, token);
    await load();
    await loadDaySlots(dayEdit);
  }

  return (
    <AdminY2KLayout>
      <div className="flex-1 overflow-y-auto pb-10">
        <h1 className="mb-3 text-4xl font-black tracking-tight text-white md:text-5xl">CALENDRIER &amp; BLOCAGES</h1>
        <p className="mb-10 max-w-3xl text-base leading-relaxed text-neutral-300 sm:text-lg">
          <strong className="text-white">Ouverture des mois (tous les clients) :</strong> fermez un mois entier pour
          qu&apos;aucun client ne puisse y réserver (ex. juin fermé tant que vous ne l&apos;activez pas).{" "}
          <strong className="text-white">Journées et créneaux :</strong> blocages précis ci-dessous.
        </p>

        <ChromeCard
          title="Ouverture du calendrier client par mois"
          subtitle="Le mois courant est ouvert par défaut. Les mois suivants sont fermés jusqu’à activation."
          className="mb-8 border-white/10"
          innerClassName="p-5 sm:p-7 md:p-8"
        >
          {loadingMonths ? (
            <p className="text-base text-neutral-400">Chargement…</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
              {monthAccess.map((m) => (
                <div
                  key={`${m.year}-${m.month}`}
                  className={cn(
                    "flex h-full min-h-[11.5rem] flex-col rounded-2xl border p-5 sm:min-h-[12rem] sm:p-6",
                    m.openForClients
                      ? "border-emerald-500/45 bg-emerald-950/25"
                      : "border-amber-500/40 bg-amber-950/20"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold leading-tight text-white sm:text-lg">{m.label}</p>
                      <p className="mt-1.5 min-h-[1.25rem] text-xs text-violet-300 sm:text-sm">
                        {m.isCurrentMonth ? "Mois actuel" : "\u00a0"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide sm:text-sm",
                        m.openForClients
                          ? "bg-emerald-500/25 text-emerald-100"
                          : "bg-amber-500/20 text-amber-100"
                      )}
                    >
                      {m.openForClients ? "Ouvert" : "Fermé"}
                    </span>
                  </div>
                  <div className="mt-auto flex justify-stretch pt-5 sm:pt-6">
                    {!m.openForClients ? (
                      <button
                        type="button"
                        className={cn(
                          btnActionBaseClass,
                          "inline-flex w-full items-center justify-center bg-emerald-700 hover:bg-emerald-600"
                        )}
                        onClick={() => void setMonthOpen(m.year, m.month, true)}
                      >
                        Activer le mois
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={cn(
                          btnActionBaseClass,
                          "inline-flex w-full items-center justify-center bg-amber-700 hover:bg-amber-600"
                        )}
                        onClick={() => void setMonthOpen(m.year, m.month, false)}
                      >
                        Fermer le mois
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChromeCard>

        <ChromeCard
          title="Option 1 — Bloquer toute la journée"
          subtitle="Une seule action : ce jour disparaît pour tous les clients (tous les créneaux fermés)."
          className="mb-8 border-white/10"
          innerClassName="p-5 sm:p-7 md:p-8"
        >
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-3 md:gap-5">
            <AdminDateInput value={date} onChange={(e) => setDate(e.target.value)} required className="h-12" />
            <input
              className={inputClass}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Raison"
              required
            />
            <button className={btnPrimaryClass} type="submit">
              Bloquer la journée entière
            </button>
          </form>
        </ChromeCard>

        <ChromeCard
          title="Option 2 — Bloquer seulement un créneau (2 h) sur un jour"
          subtitle="Choisissez d’abord la date, puis un des cinq créneaux. La journée reste visible pour les autres plages."
          className="mb-8 border-white/10"
          innerClassName="p-5 sm:p-7 md:p-8"
        >
          <div className="mb-6 flex flex-wrap items-end gap-3">
            <label className="flex max-w-md flex-col gap-2">
              <span className={labelClass}>Date concernée</span>
              <AdminDateInput value={dayEdit} onChange={(e) => setDayEdit(e.target.value)} className="h-12" />
            </label>
          </div>
          {loadingDay ? (
            <p className="text-base text-neutral-400">Chargement des créneaux…</p>
          ) : !dayEdit ? (
            <p className="text-base text-neutral-400">Sélectionnez une date pour afficher les 5 créneaux.</p>
          ) : fullDayBlocked ? (
            <div className="space-y-4">
              <p className="text-base leading-relaxed text-amber-100 sm:text-lg">
                Cette date est déjà en <strong>blocage journée entière</strong>. Les cinq créneaux sont fermés. Pour
                gérer plage par plage, retirez d’abord le blocage journée dans la liste « Journées entièrement bloquées »
                ci-dessous.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {daySlots.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 text-base text-neutral-400 sm:p-5"
                  >
                    <span className="font-semibold text-neutral-200 sm:text-lg">{s.label}</span>
                    <span className="mt-2 block text-sm text-neutral-400">Fermé (journée entière)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 md:gap-5">
              {daySlots.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    "flex flex-col gap-3 rounded-xl border bg-black/30 p-4 sm:gap-4 sm:p-5",
                    s.adminBlocked
                      ? "border-amber-500/50 ring-1 ring-amber-500/20"
                      : "border-white/15"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="text-base font-bold text-white sm:text-lg">{s.label}</div>
                    {s.adminBlocked ? (
                      <span className="shrink-0 rounded-full border border-amber-400/50 bg-amber-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-100">
                        2 h bloquées
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm uppercase tracking-wider text-neutral-400 sm:text-base">
                    {s.startTime} – {s.endTime}
                  </p>
                  {s.adminBlocked ? (
                    <p className="text-base leading-relaxed text-amber-100/95">
                      Ce créneau de <strong>2 heures</strong> est bloqué pour les clients. Utilisez le bouton vert{" "}
                      pour rouvrir cette plage.
                    </p>
                  ) : null}
                  {s.bookings.length > 0 ? (
                    <ul className="space-y-1 text-sm text-neutral-300 sm:text-base">
                      {s.bookings.map((b) => (
                        <li key={b.requestId}>
                          Demande …{b.requestId.slice(-6)} — {b.company || "Client"}
                        </li>
                      ))}
                    </ul>
                  ) : !s.adminBlocked ? (
                    <span className="text-sm text-neutral-400 sm:text-base">Aucune demande sur ce créneau</span>
                  ) : null}
                  <div className="mt-auto flex flex-wrap gap-2">
                    {s.adminBlocked && s.blockedSlotId ? (
                      <button
                        type="button"
                        className={cn(btnActionBaseClass, "bg-emerald-700 hover:bg-emerald-600")}
                        onClick={() => unblockSlot(s.blockedSlotId!)}
                      >
                        Débloquer ce créneau
                      </button>
                    ) : s.free ? (
                      <button
                        type="button"
                        className={cn(btnActionBaseClass, "bg-red-700 hover:bg-red-600")}
                        onClick={() => blockSlot(s.id)}
                      >
                        Bloquer ce créneau seulement
                      </button>
                    ) : (
                      <span className="text-sm text-amber-200/90 sm:text-base">
                        Déjà réservé par une demande — impossible de bloquer admin ici
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChromeCard>

        <h2 className="mb-3 text-xl font-bold text-white sm:text-2xl">Journées entièrement bloquées (liste)</h2>
        <p className="mb-4 text-sm leading-relaxed text-neutral-400 sm:text-base">
          Retirer un blocage journée pour réactiver les créneaux (sauf créneaux bloqués séparément).
        </p>
        <div className="space-y-5">
          {blocked.length === 0 ? (
            <p className="text-base text-neutral-400">Aucune journée bloquée.</p>
          ) : null}
          {blocked.map((b) => (
            <ChromeCard
              key={b._id}
              title={new Date(b.date).toLocaleDateString()}
              subtitle={b.reason}
              innerClassName="p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="text-base text-neutral-200 sm:text-lg">
                  {new Date(b.date).toLocaleDateString()} — {b.reason}
                </span>
                <button
                  onClick={() => remove(b._id)}
                  className={cn(btnActionBaseClass, "shrink-0 bg-red-600 hover:bg-red-500")}
                >
                  Débloquer la journée
                </button>
              </div>
            </ChromeCard>
          ))}
        </div>

        <h2 className="mb-3 mt-12 text-xl font-bold text-white sm:text-2xl">Créneaux bloqués seulement (2 h) — liste</h2>
        <p className="mb-4 max-w-3xl text-sm leading-relaxed text-neutral-400 sm:text-base">
          Ici : uniquement les plages de <strong className="text-neutral-200">2 heures</strong> fermées par
          l&apos;option 2. Débloquer ici ne retire que cette plage ; cela ne modifie pas les journées bloquées en entier
          (liste au-dessus).
        </p>
        <div className="space-y-5">
          {blockedSlotsList.length === 0 ? (
            <p className="text-base text-neutral-400">Aucun créneau isolé bloqué.</p>
          ) : null}
          {blockedSlotsList.map((row) => (
            <ChromeCard
              key={row._id}
              title={`${new Date(row.date).toLocaleDateString()} — ${row.slotLabel}`}
              subtitle={`2 h · ${row.reason || "indisponible"}`}
              innerClassName="p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="text-base text-neutral-200 sm:text-lg">
                  {new Date(row.date).toLocaleDateString()} — {row.slotLabel} ({row.slotId})
                </span>
                <button
                  type="button"
                  onClick={() => unblockSlot(row._id)}
                  className={cn(btnActionBaseClass, "shrink-0 bg-emerald-700 hover:bg-emerald-600")}
                >
                  Débloquer ce créneau (2 h)
                </button>
              </div>
            </ChromeCard>
          ))}
        </div>
      </div>
    </AdminY2KLayout>
  );
}
