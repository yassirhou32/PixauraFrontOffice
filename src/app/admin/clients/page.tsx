/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Eye,
  EyeOff,
  Hash,
  Mail,
  Pencil,
  Phone,
  Trash2,
  User,
  UserPlus,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { AdminY2KLayout, ChromeCard } from "@/components/admin/Y2KAdminLayout";
import { cn } from "@/lib/utils";

const inputClass =
  "h-12 w-full rounded-xl border border-white/15 bg-black/50 px-4 text-base text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-violet-400/55 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-45 sm:h-[3.25rem]";

const labelClass =
  "text-xs font-semibold uppercase tracking-[0.12em] text-neutral-300 sm:text-sm sm:tracking-[0.14em]";

type ClientFormFieldKey =
  | "companyName"
  | "headOfficeAddress"
  | "siret"
  | "managerName"
  | "phone"
  | "email"
  | "clientType"
  | "password";

type ClientFormErrors = Partial<Record<ClientFormFieldKey, string>>;

const REQUIRED_MSG = "Champ requis";

const CLIENT_TYPE_VALUES = ["paire", "impaire", "vip"] as const;

function Field({
  label,
  children,
  className,
  error,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  error?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className={labelClass}>{label}</span>
      {children}
      {error ? <p className="text-xs font-medium text-red-300 sm:text-sm">{error}</p> : null}
    </div>
  );
}

function buildClientPayload(form: typeof defaultFormState, includePassword: boolean) {
  return {
    companyName: form.companyName.trim(),
    headOfficeAddress: form.headOfficeAddress.trim(),
    siret: form.siret.trim(),
    managerName: form.managerName.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    clientType: form.clientType,
    notes: form.notes.trim(),
    ...(includePassword ? { password: form.password } : {}),
  };
}

const defaultFormState = {
  companyName: "",
  headOfficeAddress: "",
  siret: "",
  managerName: "",
  phone: "",
  email: "",
  clientType: "paire",
  notes: "",
  password: "",
};

function validateClientForm(
  form: typeof defaultFormState,
  options: { requirePassword: boolean }
): ClientFormErrors {
  const errors: ClientFormErrors = {};
  if (!form.companyName.trim()) errors.companyName = REQUIRED_MSG;
  if (!form.headOfficeAddress.trim()) errors.headOfficeAddress = REQUIRED_MSG;
  if (!form.siret.trim()) errors.siret = REQUIRED_MSG;
  if (!form.managerName.trim()) errors.managerName = REQUIRED_MSG;
  if (!form.phone.trim()) errors.phone = REQUIRED_MSG;
  if (!form.email.trim()) errors.email = REQUIRED_MSG;
  if (!form.clientType.trim() || !CLIENT_TYPE_VALUES.includes(form.clientType as (typeof CLIENT_TYPE_VALUES)[number])) {
    errors.clientType = REQUIRED_MSG;
  }
  if (options.requirePassword && !form.password.trim()) errors.password = REQUIRED_MSG;
  return errors;
}

const inputErrorClass = "border-red-400/70 focus:border-red-400/80 focus:ring-red-500/30";

function PasswordInput({
  value,
  onChange,
  placeholder,
  required,
  disabled,
  autoComplete = "new-password",
  hasError,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  hasError?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <motion.div className="relative">
      <input
        className={cn(inputClass, "pr-12", hasError && inputErrorClass)}
        placeholder={placeholder}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => setVisible((v) => !v)}
        className={cn(
          "absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-400 transition-colors",
          "hover:bg-white/10 hover:text-white",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/40",
          disabled && "pointer-events-none opacity-40"
        )}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      >
        {visible ? <Eye className="h-4 w-4" strokeWidth={2} /> : <EyeOff className="h-4 w-4" strokeWidth={2} />}
      </button>
    </motion.div>
  );
}

const CALENDAR_RULE_LABEL: Record<string, string> = {
  paire: "Semaine paire",
  impaire: "Semaine impaire",
  vip: "VIP",
};

function ClientContactRow({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex gap-4 sm:gap-5">
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
          accent
            ? "border-indigo-400/25 bg-indigo-500/12 text-indigo-200"
            : "border-white/10 bg-white/[0.04] text-neutral-300"
        )}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500 sm:text-[11px]">
          {label}
        </p>
        <p
          className={cn(
            "break-words text-[15px] leading-snug text-neutral-100 sm:text-base",
            label === "SIRET" && "font-mono tracking-wide text-neutral-200"
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function ClientCard({
  client,
  onEdit,
  onDelete,
}: {
  client: any;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const ruleLabel = CALENDAR_RULE_LABEL[client.clientType] || client.clientType || "—";

  return (
    <ChromeCard
      innerClassName="!p-0"
      className={cn(
        "group h-full overflow-hidden",
        "border border-white/[0.08] bg-neutral-950/70",
        "shadow-[0_4px_24px_-8px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.04)_inset]",
        "transition-all duration-500 ease-out",
        "hover:border-indigo-400/20 hover:shadow-[0_28px_64px_-24px_rgba(79,70,229,0.45),0_0_0_1px_rgba(129,140,248,0.12)_inset]"
      )}
    >
      <div className="pointer-events-none h-px w-full bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent opacity-80" />

      <div className="flex h-full flex-col px-6 py-7 sm:px-8 sm:py-9">
        <header className="flex items-start gap-5 sm:gap-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-600/25 to-indigo-950/80 text-violet-100 shadow-[0_8px_24px_-12px_rgba(99,102,241,0.55),inset_0_1px_0_rgba(255,255,255,0.12)] transition-transform duration-500 group-hover:scale-[1.02]">
            <Building2 className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div className="min-w-0 flex-1 space-y-4">
            <h3 className="text-xl font-black uppercase leading-[1.15] tracking-[0.02em] text-white sm:text-[1.65rem]">
              {client.companyName}
            </h3>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-950/60 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.9)]" aria-hidden />
              {ruleLabel}
            </span>
          </div>
        </header>

        <div className="my-8 space-y-6 rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.045] via-white/[0.02] to-transparent px-5 py-6 sm:my-9 sm:space-y-7 sm:px-6 sm:py-7">
          <ClientContactRow icon={Mail} label="E-mail" value={client.email || "—"} accent />
          {client.phone ? <ClientContactRow icon={Phone} label="Téléphone" value={client.phone} /> : null}
          {client.siret ? <ClientContactRow icon={Hash} label="SIRET" value={client.siret} /> : null}
        </div>

        <footer className="mt-auto grid grid-cols-1 gap-3 border-t border-white/[0.06] pt-7 sm:grid-cols-2 sm:gap-4 sm:pt-8">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3.5 text-sm font-semibold uppercase tracking-[0.08em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-300 hover:border-white/28 hover:bg-white/[0.09] active:scale-[0.99]"
          >
            <Pencil className="h-4 w-4 opacity-90" strokeWidth={1.75} />
            Modifier
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-red-500/25 bg-red-950/40 px-5 py-3.5 text-sm font-semibold uppercase tracking-[0.08em] text-red-100/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 hover:border-red-400/40 hover:bg-red-950/65 active:scale-[0.99]"
          >
            <Trash2 className="h-4 w-4 opacity-90" strokeWidth={1.75} />
            Supprimer
          </button>
        </footer>
      </div>
    </ChromeCard>
  );
}

export default function AdminClientsPage() {
  const router = useRouter();
  const token = typeof window !== "undefined" ? getToken() : "";
  const [clients, setClients] = useState<any[]>([]);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "info">("info");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...defaultFormState });
  const [fieldErrors, setFieldErrors] = useState<ClientFormErrors>({});

  function clearFieldError(key: keyof ClientFormErrors) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  const load = () => apiFetch<any[]>("/clients", {}, token).then(setClients);

  function showFeedback(message: string, type: "success" | "error" | "info") {
    setFeedback(message);
    setFeedbackType(type);
    window.setTimeout(() => {
      setFeedback("");
    }, 6000);
  }

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "admin") return router.push("/login");
    const t = getToken();
    apiFetch<any[]>("/clients", {}, t)
      .then(setClients)
      .catch(() => router.push("/login"));
  }, [router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFeedback("");
    const errors = validateClientForm(form, { requirePassword: true });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    try {
      await apiFetch(
        "/clients",
        { method: "POST", body: JSON.stringify(buildClientPayload(form, true)) },
        token
      );
      showFeedback("Client créé avec succès.", "success");
      setForm({ ...defaultFormState });
      setFieldErrors({});
      load();
    } catch (err: any) {
      showFeedback(err.message || "Erreur lors de la création du client.", "error");
    }
  }

  function startEdit(client: any) {
    setFieldErrors({});
    setEditingId(client._id);
    setForm({
      companyName: client.companyName || "",
      headOfficeAddress: client.headOfficeAddress || "",
      siret: client.siret || "",
      managerName: client.managerName || "",
      phone: client.phone || "",
      email: client.email || "",
      clientType: client.clientType || "paire",
      notes: client.notes || "",
      password: "",
    });
    showFeedback("Mode modification actif.", "info");
  }

  async function submitEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setFeedback("");
    const errors = validateClientForm(form, { requirePassword: false });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    try {
      await apiFetch(
        `/clients/${editingId}`,
        {
          method: "PUT",
          body: JSON.stringify(buildClientPayload(form, false)),
        },
        token
      );
      showFeedback("Client modifié avec succès.", "success");
      setEditingId(null);
      setForm({ ...defaultFormState });
      load();
    } catch (err: any) {
      showFeedback(err.message || "Erreur lors de la modification.", "error");
    }
  }

  async function removeClient(id: string) {
    const ok = window.confirm("Confirmer la suppression du client ?");
    if (!ok) return;
    setFeedback("");
    try {
      await apiFetch(`/clients/${id}`, { method: "DELETE" }, token);
      showFeedback("Client supprimé avec succès.", "success");
      if (editingId === id) {
        setEditingId(null);
        setForm({ ...defaultFormState });
      }
      load();
    } catch (err: any) {
      showFeedback(err.message || "Erreur lors de la suppression.", "error");
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setFieldErrors({});
    showFeedback("Modification annulée.", "info");
    setForm({ ...defaultFormState });
  }

  return (
    <AdminY2KLayout>
      <div className="flex-1 overflow-y-auto pb-12">
        <header className="mb-8 flex flex-col gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-violet-300/80">Annuaire</p>
          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">Clients</h1>
          <p className="max-w-2xl text-base leading-relaxed text-neutral-300">
            Création d&apos;accès espace membre, profil semaine (paire / impaire / VIP) et suivi des coordonnées.
          </p>
        </header>

        <ChromeCard
          title={editingId ? "Modifier le client" : "Nouveau client"}
          subtitle={editingId ? "Les champs sont préremplis — le mot de passe ne se modifie pas ici." : "Création du compte d'accès membre."}
          className="mb-10 border-white/10"
          innerClassName="p-5 sm:p-7 md:p-8"
        >
          <form noValidate onSubmit={editingId ? submitEdit : submit} className="grid gap-6 md:grid-cols-2 md:gap-7">
            <Field label="Entreprise *" error={fieldErrors.companyName}>
              <input
                className={cn(inputClass, fieldErrors.companyName && inputErrorClass)}
                placeholder="Nom entreprise"
                value={form.companyName}
                onChange={(e) => {
                  clearFieldError("companyName");
                  setForm({ ...form, companyName: e.target.value });
                }}
                aria-required
                aria-invalid={Boolean(fieldErrors.companyName)}
              />
            </Field>
            <Field label="Adresse du siège *" error={fieldErrors.headOfficeAddress}>
              <input
                className={cn(inputClass, fieldErrors.headOfficeAddress && inputErrorClass)}
                placeholder="Adresse complète"
                value={form.headOfficeAddress}
                onChange={(e) => {
                  clearFieldError("headOfficeAddress");
                  setForm({ ...form, headOfficeAddress: e.target.value });
                }}
                aria-required
                aria-invalid={Boolean(fieldErrors.headOfficeAddress)}
              />
            </Field>
            <Field label="SIRET *" error={fieldErrors.siret}>
              <input
                className={cn(inputClass, fieldErrors.siret && inputErrorClass)}
                placeholder="Siret"
                value={form.siret}
                onChange={(e) => {
                  clearFieldError("siret");
                  setForm({ ...form, siret: e.target.value });
                }}
                aria-required
                aria-invalid={Boolean(fieldErrors.siret)}
              />
            </Field>
            <Field label="Dirigeant / contact *" error={fieldErrors.managerName}>
              <input
                className={cn(inputClass, fieldErrors.managerName && inputErrorClass)}
                placeholder="Nom du dirigeant"
                value={form.managerName}
                onChange={(e) => {
                  clearFieldError("managerName");
                  setForm({ ...form, managerName: e.target.value });
                }}
                aria-required
                aria-invalid={Boolean(fieldErrors.managerName)}
              />
            </Field>
            <Field label="Téléphone *" error={fieldErrors.phone}>
              <input
                className={cn(inputClass, fieldErrors.phone && inputErrorClass)}
                placeholder="+33…"
                value={form.phone}
                onChange={(e) => {
                  clearFieldError("phone");
                  setForm({ ...form, phone: e.target.value });
                }}
                aria-required
                aria-invalid={Boolean(fieldErrors.phone)}
              />
            </Field>
            <Field label="E-mail (identifiant connexion) *" error={fieldErrors.email}>
              <input
                className={cn(inputClass, fieldErrors.email && inputErrorClass)}
                placeholder="contact@entreprise.fr"
                type="email"
                value={form.email}
                onChange={(e) => {
                  clearFieldError("email");
                  setForm({ ...form, email: e.target.value });
                }}
                aria-required
                aria-invalid={Boolean(fieldErrors.email)}
              />
            </Field>
            <Field label="Règle calendrier (P2C) *" error={fieldErrors.clientType}>
              <select
                className={cn(inputClass, "cursor-pointer", fieldErrors.clientType && inputErrorClass)}
                value={form.clientType}
                onChange={(e) => {
                  clearFieldError("clientType");
                  setForm({ ...form, clientType: e.target.value });
                }}
                aria-required
                aria-invalid={Boolean(fieldErrors.clientType)}
              >
                <option value="paire">Semaine paire</option>
                <option value="impaire">Semaine impaire</option>
                <option value="vip">VIP</option>
              </select>
            </Field>
            <Field label={editingId ? "Mot de passe" : "Mot de passe initial *"} error={!editingId ? fieldErrors.password : undefined}>
              <PasswordInput
                placeholder={editingId ? "inchangé depuis cet écran" : "Mot de passe transmis au client"}
                value={form.password}
                onChange={(password) => {
                  clearFieldError("password");
                  setForm({ ...form, password });
                }}
                required={false}
                disabled={!!editingId}
                hasError={Boolean(!editingId && fieldErrors.password)}
              />
            </Field>
            <Field label="Notes internes (facultatif)" className="md:col-span-2">
              <textarea
                className={cn(inputClass, "min-h-[120px] resize-y py-3.5 leading-relaxed")}
                placeholder="Informations utiles pour l'équipe… (facultatif)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                required={false}
                aria-required={false}
              />
            </Field>

            <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:items-center md:justify-between">
              {editingId ? (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="order-2 rounded-xl border border-white/15 px-5 py-3 text-xs font-bold uppercase tracking-widest text-neutral-300 transition-colors hover:border-white/25 hover:bg-white/5 md:order-1"
                >
                  Annuler
                </button>
              ) : (
                <span className="order-2 hidden text-sm text-neutral-400 md:order-1 md:inline">
                  Tous les champs * sont obligatoires. Seules les notes internes sont facultatives.
                </span>
              )}
              <button
                type="submit"
                className="order-1 inline-flex items-center justify-center gap-2.5 rounded-xl border border-indigo-300/35 bg-gradient-to-r from-indigo-600/35 via-violet-600/28 to-indigo-600/35 px-6 py-4 text-sm font-black uppercase tracking-wide text-white shadow-[0_0_28px_-8px_rgba(99,102,241,0.45)] transition-all hover:border-indigo-200/45 hover:from-indigo-500/45 hover:to-violet-500/35 md:order-2 md:min-w-[280px]"
              >
                {editingId ? (
                  <>
                    <User className="h-4 w-4" strokeWidth={2} />
                    Enregistrer les modifications
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" strokeWidth={2} />
                    Créer client + accès membre
                  </>
                )}
              </button>
            </div>
          </form>
        </ChromeCard>

        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">Clients enregistrés</h2>
            <p className="mt-1.5 text-sm text-neutral-400 sm:text-base">
              {clients.length} fiche{clients.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-9 lg:gap-10 xl:gap-12">
          {clients.map((c, i) => (
            <motion.div
              key={c._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.24) }}
            >
              <ClientCard client={c} onEdit={() => startEdit(c)} onDelete={() => removeClient(c._id)} />
            </motion.div>
          ))}
        </div>

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
                className={cn(
                  "pointer-events-auto w-full max-w-md rounded-2xl border p-3 shadow-lg backdrop-blur-xl sm:p-4",
                  feedbackType === "success" && "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
                  feedbackType === "error" && "border-red-400/40 bg-red-500/15 text-red-100",
                  feedbackType === "info" && "border-indigo-400/40 bg-indigo-500/15 text-indigo-100"
                )}
              >
                <p className="font-mono text-[10px] uppercase tracking-widest opacity-90 sm:text-xs">
                  {feedbackType === "success" ? "Succès" : feedbackType === "error" ? "Erreur" : "Information"}
                </p>
                <p className="mt-1 text-xs font-semibold leading-snug sm:text-sm">{feedback}</p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </AdminY2KLayout>
  );
}
