/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ClientCalendar from "@/components/ClientCalendar";
import { apiFetch } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import { ChromeCard } from "@/components/admin/Y2KAdminLayout";
import { MemberContactPanel } from "@/components/member/MemberBrandImagery";
import { ShootingLocationInput, isShootingCityValid } from "@/components/forms/ShootingLocationInput";
import { COMMUNICATION_AXES, isValidCommunicationAxis } from "@/lib/communicationAxes";
import {
  CALENDAR_API_BASE,
  FALLBACK_DAY_SLOTS,
  FULL_DAY_SLOT_ID,
  formatDateKey,
  type DaySlot,
  type P2cQuotaInfo,
} from "@/lib/calendarClient";

const SLOT_LABELS: Record<string, string> = {
  "08-10": "08h00 – 10h00",
  "10-12": "10h00 – 12h00",
  "14-16": "14h00 – 16h00",
  "16-18": "16h00 – 18h00",
  "18-20": "18h00 – 20h00",
};

export type P2cFormState = {
  company: string;
  mainContact: string;
  email: string;
  phone: string;
  communicationAxis: string;
  projectDetails: string;
  requestedDate: string;
  timeSlotId: string;
  shootingAddress: string;
  technicalConstraints: string;
  onsiteContact: string;
  freeComment: string;
};

const FULL_DAY_LABEL = "Journée complète (5 créneaux — 2 projets du mois)";

function validateFormFields(form: P2cFormState): string | null {
  if (!form.company.trim()) return "Le champ Entreprise est obligatoire.";
  if (!form.mainContact.trim()) return "Le champ Contact principal est obligatoire.";
  if (!form.email.trim()) return "Le champ Email est obligatoire.";
  if (!form.phone.trim()) return "Le champ Téléphone est obligatoire.";
  if (!isValidCommunicationAxis(form.communicationAxis)) {
    return "Choisissez un axe de communication.";
  }
  if (!form.projectDetails.trim()) return "Le champ Projet / demande est obligatoire.";
  if (!form.requestedDate) return "Choisissez une date dans le calendrier.";
  if (!form.timeSlotId) return "Choisissez un créneau ou la journée complète.";
  if (!isShootingCityValid(form.shootingAddress)) {
    return "Choisissez une ville française dans la liste (code postal + nom).";
  }
  if (!form.technicalConstraints.trim()) return "Le champ Contraintes techniques est obligatoire.";
  if (!form.onsiteContact.trim()) return "Le champ Contact sur place est obligatoire.";
  return null;
}

const EMPTY_FORM: P2cFormState = {
  company: "",
  mainContact: "",
  email: "",
  phone: "",
  communicationAxis: "",
  projectDetails: "",
  requestedDate: "",
  timeSlotId: "",
  shootingAddress: "",
  technicalConstraints: "",
  onsiteContact: "",
  freeComment: "",
};

export function requestToFormState(r: Record<string, unknown>): P2cFormState {
  const rawDate = r.requestedDate as string | undefined;
  let requestedDate = "";
  if (rawDate) {
    const d = new Date(rawDate);
    if (!Number.isNaN(d.getTime())) requestedDate = formatDateKey(d);
  }
  return {
    company: String(r.company || ""),
    mainContact: String(r.mainContact || ""),
    email: String(r.email || ""),
    phone: String(r.phone || ""),
    communicationAxis: String(r.communicationAxis || ""),
    projectDetails: String(r.projectDetails || ""),
    requestedDate,
    timeSlotId: String(r.timeSlotId || ""),
    shootingAddress: String(r.shootingAddress || ""),
    technicalConstraints: String(r.technicalConstraints || ""),
    onsiteContact: String(r.onsiteContact || ""),
    freeComment: String(r.freeComment || ""),
  };
}

type P2cRequestFormProps = {
  p2cSlot?: 1 | 2;
  /** Projet 2 : champs texte préremplis et verrouillés */
  scheduleOnly?: boolean;
  /** @deprecated Conservé pour compatibilité ; le P2 utilise scheduleOnly + sélecteur de créneaux */
  dateOnly?: boolean;
  requestId?: string;
  initialForm?: Partial<P2cFormState>;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  onSuccess?: (form: P2cFormState) => void;
  /** Affichage grisé, champs inactifs (P2 en attente ou P1 déjà envoyé) */
  frozen?: boolean;
  /** Bandeau vert après envoi réussi (formulaire verrouillé) */
  sentLocked?: boolean;
  /** Grille P2C côte à côte : carte pleine largeur de colonne */
  wideColumn?: boolean;
};

const lockedFieldClass =
  "box-border h-11 w-full min-w-0 cursor-not-allowed rounded-lg border border-white/8 bg-zinc-900/60 px-3 text-[15px] text-neutral-400 outline-none";

export function P2cRequestForm({
  p2cSlot = 1,
  scheduleOnly = false,
  dateOnly = false,
  requestId,
  initialForm,
  title = "Votre demande",
  subtitle = "2 projets par mois : créneau de 2 h ou journée complète. Tous les champs sont obligatoires sauf le commentaire libre.",
  submitLabel,
  onSuccess,
  frozen = false,
  sentLocked = false,
  wideColumn = false,
}: P2cRequestFormProps) {
  const isEdit = Boolean(requestId);
  const lockInfo = scheduleOnly && !isEdit;
  const hideSlotPicker = dateOnly && !isEdit;
  const inactive = frozen;
  const [authToken, setAuthToken] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("success");
  const [form, setForm] = useState<P2cFormState>({ ...EMPTY_FORM, ...initialForm });
  const [daySlots, setDaySlots] = useState<DaySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [allowedByProfile, setAllowedByProfile] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [fullDayAvailable, setFullDayAvailable] = useState(false);
  const [p2cInfo, setP2cInfo] = useState<P2cQuotaInfo | null>(null);

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "client") return;
    setAuthToken(getToken());
    if (!isEdit && !frozen && !sentLocked && p2cSlot !== 2) {
      setForm((prev) => ({
        ...prev,
        company: prev.company || user.client?.companyName || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [isEdit, frozen, sentLocked, p2cSlot]);

  useEffect(() => {
    if (!initialForm) return;
    if (sentLocked || frozen) {
      setForm({ ...EMPTY_FORM, ...initialForm });
      return;
    }
    setForm((prev) => ({ ...prev, ...initialForm }));
  }, [initialForm, sentLocked, frozen]);

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
    const q = new URLSearchParams({ date: form.requestedDate });
    if (requestId) q.set("excludeRequestId", requestId);
    fetch(`${CALENDAR_API_BASE}/calendar/day-slots?${q}`, {
      headers: { Authorization: `Bearer ${authToken}` },
      signal: ac.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error("bad status");
        return r.json();
      })
      .then((data) => {
        setDaySlots(Array.isArray(data.slots) ? data.slots : []);
        setAllowedByProfile(data.allowedByProfile !== false && !data.p2cBlocked);
        const p2c = data.p2c as P2cQuotaInfo | undefined;
        setP2cInfo(p2c || null);
        setFullDayAvailable(
          p2cSlot === 1 &&
            data.fullDayAvailable === true &&
            p2c?.canBookFullDay !== false &&
            data.allowedByProfile !== false
        );
      })
      .catch(() => {
        if (ac.signal.aborted) return;
        setDaySlots([]);
        setAllowedByProfile(false);
        setFullDayAvailable(false);
        setP2cInfo(null);
        setLoadError(true);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoadingSlots(false);
      });
    return () => ac.abort();
  }, [form.requestedDate, authToken, requestId, p2cSlot]);

  useEffect(() => {
    if (!hideSlotPicker || !form.requestedDate || loadingSlots || loadError) return;
    const preferred = form.timeSlotId;
    const pick =
      daySlots.find((s) => s.available && s.id === preferred) ||
      daySlots.find((s) => s.available);
    if (pick && form.timeSlotId !== pick.id) {
      setForm((prev) => ({ ...prev, timeSlotId: pick.id }));
    }
  }, [hideSlotPicker, form.requestedDate, form.timeSlotId, daySlots, loadingSlots, loadError]);

  function showFeedback(message: string, type: "success" | "error") {
    setFeedback(message);
    setFeedbackType(type);
    window.setTimeout(() => setFeedback(""), 5000);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    let timeSlotId = form.timeSlotId;
    if (hideSlotPicker && form.requestedDate) {
      const pick =
        daySlots.find((s) => s.available && s.id === timeSlotId) ||
        daySlots.find((s) => s.available);
      if (!pick) {
        showFeedback(
          "Aucun créneau libre sur cette date. Choisissez une autre date dans le calendrier.",
          "error"
        );
        return;
      }
      timeSlotId = pick.id;
    }
    const toValidate = { ...form, timeSlotId };
    const fieldError = validateFormFields(toValidate);
    if (fieldError) {
      showFeedback(fieldError, "error");
      return;
    }
    try {
      const token = getToken();
      const payload = {
        ...toValidate,
        p2cSlot,
        isFullDay: p2cSlot === 1 && timeSlotId === FULL_DAY_SLOT_ID,
      };
      if (isEdit && requestId) {
        await apiFetch(`/requests/${requestId}`, { method: "PATCH", body: JSON.stringify(payload) }, token);
        showFeedback("Demande mise à jour.", "success");
      } else {
        await apiFetch("/requests", { method: "POST", body: JSON.stringify(payload) }, token);
        showFeedback("Demande envoyée avec succès.", "success");
      }
      onSuccess?.(toValidate);
    } catch (err: any) {
      showFeedback(err.message || "Erreur lors de l'enregistrement.", "error");
    }
  }

  const slotsToShow =
    !loadingSlots && daySlots.length === 0 && loadError && form.requestedDate
      ? FALLBACK_DAY_SLOTS
      : daySlots;

  const buttonLabel = submitLabel || (isEdit ? "Enregistrer les modifications" : "Envoyer la demande");

  function slotLabelFromId(id: string): string {
    if (id === FULL_DAY_SLOT_ID) return FULL_DAY_LABEL;
    if (SLOT_LABELS[id]) return SLOT_LABELS[id];
    const fb = FALLBACK_DAY_SLOTS.find((s) => s.id === id);
    return fb?.label || id;
  }

  const formBody = (
        <form
          className={`grid min-h-0 w-full min-w-0 max-w-full gap-3 md:grid-cols-2 ${inactive ? "pointer-events-none" : ""}`}
          onSubmit={inactive ? (e) => e.preventDefault() : submit}
        >
          {sentLocked ? (
            <p className="rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100 md:col-span-2">
              {p2cSlot === 2
                ? "Demande envoyée — ce formulaire est verrouillé. Vos deux P2C du mois sont complets."
                : "Demande envoyée — ce formulaire est verrouillé. Passez au Projet 2 à droite."}
            </p>
          ) : null}
          {lockInfo ? (
            <p className="rounded-lg border border-violet-500/30 bg-violet-950/25 px-3 py-2 text-xs text-violet-100 md:col-span-2">
              Même formulaire que le Projet 1 : champs déjà remplis. Choisissez une{" "}
              <strong className="text-white">date</strong> (hors semaine déjà réservée) puis un{" "}
              <strong className="text-white">créneau</strong>
              {p2cSlot === 1 ? " ou la journée complète" : ""}.
            </p>
          ) : null}
          <MemberContactPanel className="md:col-span-2" compact={wideColumn}>
            <div className="grid min-w-0 gap-3 md:grid-cols-2">
              <input
                className={
                  lockInfo
                    ? lockedFieldClass
                    : "box-border h-11 w-full min-w-0 rounded-lg border border-white/12 bg-black/45 px-3 text-[15px] text-white outline-none placeholder:text-neutral-600 focus:border-violet-400/40"
                }
                placeholder="Entreprise"
                value={form.company}
                readOnly={lockInfo}
                onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
                required
              />
              <input
                className={
                  lockInfo
                    ? lockedFieldClass
                    : "box-border h-11 w-full min-w-0 rounded-lg border border-white/12 bg-black/45 px-3 text-[15px] text-white outline-none placeholder:text-neutral-600 focus:border-violet-400/40"
                }
                placeholder="Contact principal"
                value={form.mainContact}
                readOnly={lockInfo}
                onChange={(e) => setForm((prev) => ({ ...prev, mainContact: e.target.value }))}
                required
              />
              <input
                className={
                  lockInfo
                    ? lockedFieldClass
                    : "box-border h-11 w-full min-w-0 rounded-lg border border-white/12 bg-black/45 px-3 text-[15px] text-white outline-none placeholder:text-neutral-600 focus:border-violet-400/40"
                }
                placeholder="Email"
                type="email"
                value={form.email}
                readOnly={lockInfo}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
              <input
                className={
                  lockInfo
                    ? lockedFieldClass
                    : "box-border h-11 w-full min-w-0 rounded-lg border border-white/12 bg-black/45 px-3 text-[15px] text-white outline-none placeholder:text-neutral-600 focus:border-violet-400/40"
                }
                placeholder="Telephone"
                value={form.phone}
                readOnly={lockInfo}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>
          </MemberContactPanel>
          <select
            className={
              lockInfo
                ? lockedFieldClass + " cursor-not-allowed"
                : "box-border h-11 w-full min-w-0 cursor-pointer rounded-lg border border-white/12 bg-black/45 px-3 text-[15px] text-white outline-none focus:border-violet-400/40"
            }
            value={isValidCommunicationAxis(form.communicationAxis) ? form.communicationAxis : ""}
            disabled={lockInfo}
            required={!lockInfo}
            onChange={(e) => setForm((prev) => ({ ...prev, communicationAxis: e.target.value }))}
          >
            <option value="" disabled>
              Axe de communication
            </option>
            {COMMUNICATION_AXES.map((axis) => (
              <option key={axis.id} value={axis.id}>
                {axis.label}
              </option>
            ))}
          </select>
          <textarea
            className={
              lockInfo
                ? lockedFieldClass + " min-h-[82px] py-2"
                : "box-border min-h-[82px] w-full min-w-0 rounded-lg border border-white/12 bg-black/45 px-3 py-2 text-[15px] text-white outline-none placeholder:text-neutral-600 focus:border-violet-400/40 md:col-span-2"
            }
            placeholder="Projet / demande"
            value={form.projectDetails}
            readOnly={lockInfo}
            onChange={(e) => setForm((prev) => ({ ...prev, projectDetails: e.target.value }))}
            required
          />

          <div className="min-w-0 md:col-span-2">
            <div className="space-y-4 rounded-2xl border-2 border-indigo-500/35 bg-black/40 p-3 ring-1 ring-white/10 sm:space-y-5 sm:p-5">
              {isEdit ? (
                <p className="text-[11px] leading-relaxed text-violet-200/90 sm:text-xs">
                  Modification : les dates disponibles restent sélectionnables. Seules les semaines déjà utilisées par
                  votre <strong className="text-white">autre</strong> demande du mois restent fermées.
                </p>
              ) : null}
              <div className="min-w-0 overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-2 sm:overflow-visible sm:p-4">
                <ClientCalendar
                  token={authToken}
                  selectedDate={form.requestedDate}
                  excludeRequestId={requestId}
                  onSelectDate={(date) =>
                    setForm((prev) => ({
                      ...prev,
                      requestedDate: date,
                      ...(hideSlotPicker ? {} : { timeSlotId: "" }),
                    }))
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
              </div>

              {sentLocked && form.timeSlotId && form.requestedDate ? (
                <div className="rounded-xl border border-indigo-400/40 bg-indigo-500/15 px-3 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-200/90">
                    Créneau sélectionné (Projet {p2cSlot})
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">{slotLabelFromId(form.timeSlotId)}</p>
                </div>
              ) : null}

              {!hideSlotPicker && !sentLocked ? (
              <div className="min-h-[120px] space-y-2 rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-3 sm:min-h-[140px] sm:space-y-3 sm:p-4">
                <p className="text-xs font-bold text-emerald-100/95 sm:text-sm">Créneau ou journée complète</p>
                {p2cInfo && !p2cInfo.canBookFullDay && p2cInfo.remaining === 1 ? (
                  <p className="text-[11px] text-neutral-400">
                    Il vous reste 1 projet ce mois : seul un créneau de 2 h est possible (pas la journée complète).
                  </p>
                ) : null}
                {!form.requestedDate ? (
                  <p className="text-sm text-neutral-400">D’abord choisissez une date dans le calendrier.</p>
                ) : loadingSlots ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        className="h-16 animate-pulse rounded-lg border border-white/10 bg-white/5"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fullDayAvailable && allowedByProfile && !loadError ? (
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, timeSlotId: FULL_DAY_SLOT_ID }))
                        }
                        className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                          form.timeSlotId === FULL_DAY_SLOT_ID
                            ? "border-amber-400 bg-amber-500/25 text-white ring-2 ring-amber-400/50"
                            : "border-amber-500/40 bg-amber-950/30 text-amber-50 hover:bg-amber-900/40"
                        }`}
                      >
                        <span className="block text-sm font-bold">{FULL_DAY_LABEL}</span>
                        <span className="mt-1 block text-[11px] text-amber-100/80">
                          Tous les créneaux du jour sont libres · épuise vos 2 projets P2C du mois
                        </span>
                      </button>
                    ) : null}
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                      Ou un créneau de 2 h
                    </p>
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
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              ) : hideSlotPicker && form.requestedDate && !loadingSlots && !daySlots.some((s) => s.available) ? (
                <p className="text-sm text-amber-200">
                  Cette date n’est pas disponible. Choisissez-en une autre dans le calendrier.
                </p>
              ) : null}
            </div>
          </div>

          <ShootingLocationInput
            value={form.shootingAddress}
            disabled={lockInfo}
            required
            lockedInputClass={lockedFieldClass}
            editableInputClass="box-border h-11 w-full min-w-0 rounded-lg border border-white/12 bg-black/45 px-3 text-[15px] text-white outline-none placeholder:text-neutral-600 focus:border-violet-400/40"
            onChange={(shootingAddress) => setForm((prev) => ({ ...prev, shootingAddress }))}
          />
          <textarea
            className={
              lockInfo
                ? lockedFieldClass + " min-h-[72px] py-2"
                : "box-border min-h-[72px] w-full min-w-0 rounded-lg border border-white/12 bg-black/45 px-3 py-2 text-[15px] text-white outline-none placeholder:text-neutral-600 focus:border-violet-400/40 md:col-span-2"
            }
            placeholder="Contraintes techniques"
            value={form.technicalConstraints}
            readOnly={lockInfo}
            onChange={(e) => setForm((prev) => ({ ...prev, technicalConstraints: e.target.value }))}
            required
          />
          <input
            className={
              lockInfo
                ? lockedFieldClass
                : "box-border h-11 w-full min-w-0 rounded-lg border border-white/12 bg-black/45 px-3 text-[15px] text-white outline-none placeholder:text-neutral-600 focus:border-violet-400/40"
            }
            placeholder="Contact sur place"
            value={form.onsiteContact}
            readOnly={lockInfo}
            onChange={(e) => setForm((prev) => ({ ...prev, onsiteContact: e.target.value }))}
            required
          />
          <textarea
            className={
              lockInfo
                ? lockedFieldClass + " min-h-[72px] py-2"
                : "box-border min-h-[72px] w-full min-w-0 rounded-lg border border-white/12 bg-black/45 px-3 py-2 text-[15px] text-white outline-none placeholder:text-neutral-600 focus:border-violet-400/40 md:col-span-2"
            }
            placeholder="Commentaire libre (facultatif)"
            value={form.freeComment}
            readOnly={lockInfo}
            onChange={(e) => setForm((prev) => ({ ...prev, freeComment: e.target.value }))}
          />
          {!inactive ? (
            <button
              className="mt-1 box-border h-12 w-full min-w-0 rounded-lg border border-indigo-300/30 bg-gradient-to-r from-indigo-500/25 via-purple-500/18 to-indigo-500/25 px-4 text-xs font-extrabold uppercase tracking-[0.06em] text-white shadow-[0_0_16px_rgba(99,102,241,0.2)] transition-all hover:border-indigo-200/50 hover:from-indigo-500/35 hover:to-purple-500/30 sm:h-11 sm:text-sm sm:tracking-[0.08em] md:col-span-2"
              type="submit"
            >
              {buttonLabel}
            </button>
          ) : null}
        </form>
  );

  return (
    <>
      <motion.div className={inactive ? `relative ${sentLocked ? "" : "opacity-45"}` : ""}>
        {inactive && !sentLocked ? (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 rounded-2xl ring-1 ring-zinc-700/80"
          />
        ) : null}
        <ChromeCard
          title={title}
          subtitle={subtitle}
          className="!overflow-visible h-full w-full min-w-0"
          innerClassName={wideColumn ? "p-3 sm:p-4" : undefined}
        >
          {formBody}
        </ChromeCard>
      </motion.div>

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
                {feedbackType === "success" ? "Succès" : "Erreur"}
              </p>
              <p className="mt-1 text-xs font-semibold leading-snug sm:text-sm">{feedback}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
