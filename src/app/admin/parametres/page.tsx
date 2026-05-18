/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { AdminY2KLayout, ChromeCard } from "@/components/admin/Y2KAdminLayout";
import { AdminDateInput } from "@/components/admin/AdminDateInput";

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
  };

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
        <h1 className="mb-2 text-4xl font-black tracking-tight">CALENDRIER &amp; BLOCAGES</h1>
        <p className="mb-8 max-w-3xl text-sm leading-relaxed text-neutral-400">
          <strong className="text-white">Deux possibilités distinctes :</strong> soit vous fermez{" "}
          <strong className="text-white">toute une journée</strong> (aucun tournage ce jour-là), soit vous laissez la
          journée ouverte et vous fermez seulement <strong className="text-white">un ou plusieurs créneaux de 2 h</strong>{" "}
          (8h–10h, 10h–12h, 14h–16h, 16h–18h, 18h–20h) pour une date précise.
        </p>

        <ChromeCard
          title="Option 1 — Bloquer toute la journée"
          subtitle="Une seule action : ce jour disparaît pour tous les clients (tous les créneaux fermés)."
          className="mb-6"
        >
          <form onSubmit={submit} className="grid gap-2 md:grid-cols-3">
            <AdminDateInput value={date} onChange={(e) => setDate(e.target.value)} required />
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Raison" required />
            <button className="rounded bg-black p-2 text-white" type="submit">
              Bloquer la journée entière
            </button>
          </form>
        </ChromeCard>

        <ChromeCard
          title="Option 2 — Bloquer seulement un créneau (2 h) sur un jour"
          subtitle="Choisissez d’abord la date, puis un des cinq créneaux. La journée reste visible pour les autres plages."
          className="mb-6"
        >
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <label className="flex max-w-md flex-col gap-1 text-sm text-neutral-400">
              Date concernée
              <AdminDateInput value={dayEdit} onChange={(e) => setDayEdit(e.target.value)} />
            </label>
          </div>
          {loadingDay ? (
            <p className="text-neutral-500">Chargement des créneaux…</p>
          ) : !dayEdit ? (
            <p className="text-neutral-500">Sélectionnez une date pour afficher les 5 créneaux.</p>
          ) : fullDayBlocked ? (
            <div className="space-y-3">
              <p className="text-sm text-amber-200">
                Cette date est déjà en <strong>blocage journée entière</strong>. Les cinq créneaux sont fermés. Pour
                gérer plage par plage, retirez d’abord le blocage journée dans la liste « Journées entièrement bloquées »
                ci-dessous.
              </p>
              <div className="grid gap-2 md:grid-cols-2">
                {daySlots.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-lg border border-white/10 bg-zinc-900/50 p-3 text-sm text-neutral-500"
                  >
                    <span className="font-semibold text-neutral-300">{s.label}</span>
                    <span className="mt-1 block text-xs">Fermé (journée entière)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {daySlots.map((s) => (
                <div
                  key={s.id}
                  className={`flex flex-col gap-2 rounded-lg border bg-black/30 p-3 ${
                    s.adminBlocked
                      ? "border-amber-500/50 ring-1 ring-amber-500/20"
                      : "border-white/15"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="font-semibold text-white">{s.label}</div>
                    {s.adminBlocked ? (
                      <span className="shrink-0 rounded-full border border-amber-400/50 bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-100">
                        2 h bloquées
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] uppercase tracking-wider text-neutral-500">
                    {s.startTime} – {s.endTime}
                  </p>
                  {s.adminBlocked ? (
                    <p className="text-sm leading-snug text-amber-100/95">
                      Ce créneau de <strong>2 heures</strong> est bloqué pour les clients. Utilisez le bouton vert{" "}
                      pour rouvrir cette plage.
                    </p>
                  ) : null}
                  {s.bookings.length > 0 ? (
                    <ul className="text-xs text-neutral-400">
                      {s.bookings.map((b) => (
                        <li key={b.requestId}>
                          Demande …{b.requestId.slice(-6)} — {b.company || "Client"}
                        </li>
                      ))}
                    </ul>
                  ) : !s.adminBlocked ? (
                    <span className="text-xs text-neutral-500">Aucune demande sur ce créneau</span>
                  ) : null}
                  <div className="mt-auto flex flex-wrap gap-2">
                    {s.adminBlocked && s.blockedSlotId ? (
                      <button
                        type="button"
                        className="rounded bg-emerald-700 px-2 py-1 text-sm text-white"
                        onClick={() => unblockSlot(s.blockedSlotId!)}
                      >
                        Débloquer ce créneau
                      </button>
                    ) : s.free ? (
                      <button
                        type="button"
                        className="rounded bg-red-700 px-2 py-1 text-sm text-white"
                        onClick={() => blockSlot(s.id)}
                      >
                        Bloquer ce créneau seulement
                      </button>
                    ) : (
                      <span className="text-xs text-amber-200/90">
                        Déjà réservé par une demande — impossible de bloquer admin ici
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChromeCard>

        <h2 className="mb-3 text-xl font-bold text-white">Journées entièrement bloquées (liste)</h2>
        <p className="mb-3 text-xs text-neutral-500">Retirer un blocage journée pour réactiver les créneaux (sauf créneaux bloqués séparément).</p>
        <div className="space-y-4">
          {blocked.length === 0 ? (
            <p className="text-sm text-neutral-500">Aucune journée bloquée.</p>
          ) : null}
          {blocked.map((b) => (
            <ChromeCard key={b._id} title={new Date(b.date).toLocaleDateString()} subtitle={b.reason}>
              <div className="flex items-center justify-between gap-2">
                <span>
                  {new Date(b.date).toLocaleDateString()} — {b.reason}
                </span>
                <button onClick={() => remove(b._id)} className="shrink-0 rounded bg-red-600 px-2 py-1 text-white">
                  Débloquer la journée
                </button>
              </div>
            </ChromeCard>
          ))}
        </div>

        <h2 className="mb-3 mt-10 text-xl font-bold text-white">Créneaux bloqués seulement (2 h) — liste</h2>
        <p className="mb-3 max-w-3xl text-xs text-neutral-500">
          Ici : uniquement les plages de <strong className="text-neutral-300">2 heures</strong>{" "}fermées par
          l&apos;option 2. Débloquer ici ne retire que
          cette plage ; cela ne modifie pas les journées bloquées en entier (liste au-dessus).
        </p>
        <div className="space-y-4">
          {blockedSlotsList.length === 0 ? (
            <p className="text-sm text-neutral-500">Aucun créneau isolé bloqué.</p>
          ) : null}
          {blockedSlotsList.map((row) => (
            <ChromeCard
              key={row._id}
              title={`${new Date(row.date).toLocaleDateString()} — ${row.slotLabel}`}
              subtitle={`2 h · ${row.reason || "indisponible"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-neutral-300">
                  {new Date(row.date).toLocaleDateString()} — {row.slotLabel} ({row.slotId})
                </span>
                <button
                  type="button"
                  onClick={() => unblockSlot(row._id)}
                  className="shrink-0 rounded bg-emerald-700 px-2 py-1 text-sm text-white"
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
