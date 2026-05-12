/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import ClientCalendar from "@/components/ClientCalendar";
import { apiFetch } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import { MemberY2KLayout } from "@/components/member/MemberY2KLayout";
import { ChromeCard } from "@/components/admin/Y2KAdminLayout";
import {
  CALENDAR_API_BASE,
  FALLBACK_DAY_SLOTS,
  type DaySlot,
} from "@/lib/calendarClient";

const SLOT_LABELS: Record<string, string> = {
  "08-10": "08h00 – 10h00",
  "10-12": "10h00 – 12h00",
  "14-16": "14h00 – 16h00",
  "16-18": "16h00 – 18h00",
  "18-20": "18h00 – 20h00",
};

export default function MembreP2CPage() {
  const router = useRouter();
  const [authToken, setAuthToken] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("success");
  const [form, setForm] = useState({
    company: "",
    mainContact: "",
    email: "",
    phone: "",
    communicationAxis: "commercial",
    projectDetails: "",
    requestedDate: "",
    timeSlotId: "",
    shootingAddress: "",
    technicalConstraints: "",
    onsiteContact: "",
    freeComment: "",
  });

  const [daySlots, setDaySlots] = useState<DaySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [allowedByProfile, setAllowedByProfile] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "client") return router.push("/login");
    setForm((prev) => ({ ...prev, company: user.client?.companyName || "", email: user.email || "" }));
    setAuthToken(getToken());
  }, [router]);

  useEffect(() => {
    if (!form.requestedDate || !authToken) {
      setDaySlots([]);
      setLoadError(false);
      setLoadingSlots(false);
      return;
    }
    const ac = new AbortController();
    queueMicrotask(() => {
      setLoadError(false);
      setLoadingSlots(true);
      setDaySlots([]);
    });
    fetch(
      `${CALENDAR_API_BASE}/calendar/day-slots?date=${encodeURIComponent(form.requestedDate)}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        signal: ac.signal,
      }
    )
      .then((r) => {
        if (!r.ok) throw new Error("bad status");
        return r.json();
      })
      .then((data) => {
        setDaySlots(Array.isArray(data.slots) ? data.slots : []);
        setAllowedByProfile(data.allowedByProfile !== false);
      })
      .catch(() => {
        if (ac.signal.aborted) return;
        setDaySlots([]);
        setAllowedByProfile(false);
        setLoadError(true);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoadingSlots(false);
      });
    return () => ac.abort();
  }, [form.requestedDate, authToken]);

  function showFeedback(message: string, type: "success" | "error") {
    setFeedback(message);
    setFeedbackType(type);
    window.setTimeout(() => {
      setFeedback("");
    }, 5000);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.timeSlotId) {
      showFeedback("Choisissez une date puis un creneau horaire (2 h).", "error");
      return;
    }
    if (!form.requestedDate) {
      showFeedback("Choisissez une date dans le calendrier.", "error");
      return;
    }
    try {
      const token = getToken();
      await apiFetch("/requests", { method: "POST", body: JSON.stringify(form) }, token);
      showFeedback("Demande envoyée avec succès. Suivez son statut dans Mes demandes.", "success");
    } catch (err: any) {
      showFeedback(err.message || "Erreur lors de l'envoi de la demande.", "error");
    }
  }

  const slotsToShow =
    !loadingSlots && daySlots.length === 0 && loadError && form.requestedDate
      ? FALLBACK_DAY_SLOTS
      : daySlots;

  return (
    <MemberY2KLayout>
      <p className="mb-3 text-sm leading-relaxed text-neutral-400 sm:mb-4">
        <Link href="/membre/demandes" className="text-violet-300 underline-offset-4 hover:text-white hover:underline">
          Voir le suivi de mes demandes
        </Link>
      </p>
      <h2 className="mb-4 bg-gradient-to-b from-white to-white/60 bg-clip-text text-2xl font-black tracking-tight text-transparent sm:mb-6 sm:text-3xl md:text-4xl">
        P2C mensuel
      </h2>

      <ChromeCard
        title="Votre demande"
        subtitle="Étape 1 : calendrier. Étape 2 : date affichée. Étape 3 : un des 5 créneaux de 2 h."
        className="!overflow-visible"
      >
        <form className="grid min-h-0 w-full min-w-0 max-w-full gap-3 md:grid-cols-2" onSubmit={submit}>
          <input
            className="box-border h-11 w-full min-w-0 rounded-lg border border-white/12 bg-black/45 px-3 text-[15px] text-white outline-none placeholder:text-neutral-600 focus:border-violet-400/40"
            placeholder="Entreprise"
            value={form.company}
            onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
            required
          />
          <input
            className="box-border h-11 w-full min-w-0 rounded-lg border border-white/12 bg-black/45 px-3 text-[15px] text-white outline-none placeholder:text-neutral-600 focus:border-violet-400/40"
            placeholder="Contact principal"
            value={form.mainContact}
            onChange={(e) => setForm((prev) => ({ ...prev, mainContact: e.target.value }))}
            required
          />
          <input
            className="box-border h-11 w-full min-w-0 rounded-lg border border-white/12 bg-black/45 px-3 text-[15px] text-white outline-none placeholder:text-neutral-600 focus:border-violet-400/40"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <input
            className="box-border h-11 w-full min-w-0 rounded-lg border border-white/12 bg-black/45 px-3 text-[15px] text-white outline-none placeholder:text-neutral-600 focus:border-violet-400/40"
            placeholder="Telephone"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            required
          />
          <select
            className="box-border h-11 w-full min-w-0 cursor-pointer rounded-lg border border-white/12 bg-black/45 px-3 text-[15px] text-white outline-none focus:border-violet-400/40"
            value={form.communicationAxis}
            onChange={(e) => setForm((prev) => ({ ...prev, communicationAxis: e.target.value }))}
          >
            <option value="commercial">Commercial</option>
            <option value="humain">Humain</option>
            <option value="expertise">Expertise</option>
            <option value="autre">Autre</option>
          </select>
          <textarea
            className="box-border min-h-[82px] w-full min-w-0 rounded-lg border border-white/12 bg-black/45 px-3 py-2 text-[15px] text-white outline-none placeholder:text-neutral-600 focus:border-violet-400/40 md:col-span-2"
            placeholder="Projet / demande"
            value={form.projectDetails}
            onChange={(e) => setForm((prev) => ({ ...prev, projectDetails: e.target.value }))}
            required
          />

          <div className="min-w-0 md:col-span-2">
            <div className="space-y-4 rounded-2xl border-2 border-indigo-500/35 bg-black/40 p-3 ring-1 ring-white/10 sm:space-y-5 sm:p-5">
              <div className="min-w-0 overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-2 sm:overflow-visible sm:p-4">
                <ClientCalendar
                  token={authToken}
                  selectedDate={form.requestedDate}
                  onSelectDate={(date) =>
                    setForm((prev) => ({ ...prev, requestedDate: date, timeSlotId: "" }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="p2c-date-field"
                  className="block text-xs font-bold uppercase tracking-wide text-white sm:text-sm"
                >
                  Date de tournage sélectionnée
                </label>
                <input
                  id="p2c-date-field"
                  readOnly
                  tabIndex={-1}
                  value={form.requestedDate}
                  placeholder="Cliquez une date dans la grille ci-dessus"
                  className="box-border h-12 w-full min-w-0 max-w-full break-all rounded-xl border-2 border-white/30 bg-white/10 px-3 py-2 font-mono text-sm text-white outline-none placeholder:text-neutral-500 focus:border-indigo-400/70 sm:h-14 sm:px-4 sm:text-lg"
                />
                <p className="text-[11px] leading-relaxed text-neutral-400 sm:text-xs">
                  Ce champ se remplit automatiquement quand vous choisissez un jour dans le calendrier.
                </p>
              </div>

              <div className="min-h-[120px] space-y-2 rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-3 sm:min-h-[140px] sm:space-y-3 sm:p-4">
                <p className="text-xs font-bold text-emerald-100/95 sm:text-sm">Créneaux de 2 h — choisissez-en un</p>
                {!form.requestedDate ? (
                  <p className="text-sm text-neutral-400">D’abord choisissez une date dans le calendrier.</p>
                ) : loadingSlots ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-16 animate-pulse rounded-lg border border-white/10 bg-white/5"
                      />
                    ))}
                  </div>
                ) : (
                  <>
                    {loadError ? (
                      <p className="text-sm text-amber-200">
                        Impossible de charger les créneaux (réseau ou session). Reconnectez-vous si besoin.
                      </p>
                    ) : null}
                    {!allowedByProfile && slotsToShow.length > 0 ? (
                      <p className="text-sm text-amber-200">
                        Ce jour n’est pas dans votre semaine autorisée (paire / impaire / VIP). Les créneaux ne sont pas
                        réservables.
                      </p>
                    ) : null}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {slotsToShow.map((s) => {
                        const pickable = s.available && allowedByProfile && !loadError;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            disabled={!pickable}
                            onClick={() =>
                              pickable && setForm((prev) => ({ ...prev, timeSlotId: s.id }))
                            }
                            className={`min-w-0 rounded-lg border px-2.5 py-2.5 text-left text-xs transition-colors sm:px-3 sm:py-3 sm:text-sm ${
                              form.timeSlotId === s.id
                                ? "border-indigo-400 bg-indigo-500/35 text-white ring-2 ring-indigo-400/50"
                                : pickable
                                  ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
                                  : "cursor-not-allowed border-white/10 bg-zinc-900/80 text-zinc-500"
                            }`}
                          >
                            <span className="font-bold">{s.label}</span>
                            <span className="mt-1 block font-mono text-[11px] text-neutral-400">
                              {s.startTime} – {s.endTime}
                            </span>
                            {!pickable && s.reason === "profil" ? (
                              <span className="mt-1 block text-[10px] uppercase text-zinc-500">Profil</span>
                            ) : null}
                            {!pickable && s.reason === "reserve" ? (
                              <span className="mt-1 block text-[10px] uppercase text-zinc-500">Réservé</span>
                            ) : null}
                            {!pickable && s.reason === "admin" ? (
                              <span className="mt-1 block text-[10px] uppercase text-zinc-500">Bloqué admin</span>
                            ) : null}
                            {!pickable && s.reason === "jour_bloque" ? (
                              <span className="mt-1 block text-[10px] uppercase text-zinc-500">Jour bloqué</span>
                            ) : null}
                            {!pickable && s.reason === "erreur" ? (
                              <span className="mt-1 block text-[10px] uppercase text-zinc-500">—</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {form.requestedDate ? (
                <p className="break-words rounded-lg border border-white/15 bg-black/30 px-2.5 py-2 text-xs text-neutral-200 sm:px-3 sm:text-sm">
                  <span className="font-mono text-xs text-neutral-500">Récap :</span>{" "}
                  <strong className="text-white">{form.requestedDate}</strong>
                  {form.timeSlotId ? (
                    <>
                      {" "}
                      · créneau <strong className="text-white">{SLOT_LABELS[form.timeSlotId] || form.timeSlotId}</strong>
                    </>
                  ) : (
                    <span className="text-amber-200/90"> · choisissez un créneau vert ci-dessus.</span>
                  )}
                </p>
              ) : null}
            </div>
          </div>

          <input
            className="box-border h-11 w-full min-w-0 rounded-lg border border-white/12 bg-black/45 px-3 text-[15px] text-white outline-none placeholder:text-neutral-600 focus:border-violet-400/40"
            placeholder="Adresse tournage"
            value={form.shootingAddress}
            onChange={(e) => setForm((prev) => ({ ...prev, shootingAddress: e.target.value }))}
            required
          />
          <textarea
            className="box-border min-h-[72px] w-full min-w-0 rounded-lg border border-white/12 bg-black/45 px-3 py-2 text-[15px] text-white outline-none placeholder:text-neutral-600 focus:border-violet-400/40 md:col-span-2"
            placeholder="Contraintes techniques"
            value={form.technicalConstraints}
            onChange={(e) => setForm((prev) => ({ ...prev, technicalConstraints: e.target.value }))}
          />
          <input
            className="box-border h-11 w-full min-w-0 rounded-lg border border-white/12 bg-black/45 px-3 text-[15px] text-white outline-none placeholder:text-neutral-600 focus:border-violet-400/40"
            placeholder="Contact sur place"
            value={form.onsiteContact}
            onChange={(e) => setForm((prev) => ({ ...prev, onsiteContact: e.target.value }))}
          />
          <textarea
            className="box-border min-h-[72px] w-full min-w-0 rounded-lg border border-white/12 bg-black/45 px-3 py-2 text-[15px] text-white outline-none placeholder:text-neutral-600 focus:border-violet-400/40 md:col-span-2"
            placeholder="Commentaire libre"
            value={form.freeComment}
            onChange={(e) => setForm((prev) => ({ ...prev, freeComment: e.target.value }))}
          />
          <button
            className="mt-1 box-border h-12 w-full min-w-0 rounded-lg border border-indigo-300/30 bg-gradient-to-r from-indigo-500/25 via-purple-500/18 to-indigo-500/25 px-4 text-xs font-extrabold uppercase tracking-[0.06em] text-white shadow-[0_0_16px_rgba(99,102,241,0.2)] transition-all hover:border-indigo-200/50 hover:from-indigo-500/35 hover:to-purple-500/30 sm:h-11 sm:text-sm sm:tracking-[0.08em] md:col-span-2"
            type="submit"
          >
            Envoyer la demande
          </button>
        </form>
      </ChromeCard>
      <AnimatePresence>
        {feedback ? (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none fixed bottom-4 left-3 right-3 z-[100] flex justify-center sm:bottom-6 sm:left-6 sm:right-6"
          >
            <div
              className={`pointer-events-auto w-full max-w-md rounded-2xl border p-3 shadow-lg backdrop-blur-xl sm:p-4 ${
                feedbackType === "success"
                  ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                  : "border-red-400/40 bg-red-500/15 text-red-100"
              }`}
            >
              <p className="font-mono text-[10px] uppercase tracking-widest opacity-90 sm:text-xs">
                {feedbackType === "success" ? "Succes" : "Erreur"}
              </p>
              <p className="mt-1 text-xs font-semibold leading-snug sm:text-sm">{feedback}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </MemberY2KLayout>
  );
}
