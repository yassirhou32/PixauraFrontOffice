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
import { clientTypePill } from "@/components/admin/demandeUi";
import { cn } from "@/lib/utils";

const inputClass =
  "h-11 w-full rounded-xl border border-white/12 bg-black/45 px-3.5 text-sm text-white outline-none transition-colors placeholder:text-neutral-600 focus:border-violet-400/50 focus:ring-1 focus:ring-violet-500/25 disabled:cursor-not-allowed disabled:opacity-45";

const labelClass = "text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500";

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-2", className)}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  required,
  disabled,
  autoComplete = "new-password",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <motion.div className="relative">
      <input
        className={cn(inputClass, "pr-11")}
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
        {visible ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
      </button>
    </motion.div>
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
  return (
    <ChromeCard className="group h-full border-white/10 transition-all duration-300 hover:border-white/18 hover:shadow-[0_20px_50px_-28px_rgba(99,102,241,0.35)]">
      <div className="flex h-full flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-violet-300/90 ring-1 ring-white/10 transition-colors group-hover:bg-violet-500/15 group-hover:text-violet-200">
                <Building2 className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <h3 className="truncate text-lg font-black uppercase tracking-tight text-white md:text-xl">{client.companyName}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 pl-[2.25rem]">
              {clientTypePill(client.clientType)}
            </div>
          </div>
        </div>

        <div className="space-y-2.5 rounded-xl border border-white/6 bg-black/30 px-3.5 py-3">
          <div className="flex items-center gap-2.5 text-xs text-neutral-300">
            <Mail className="h-3.5 w-3.5 shrink-0 text-indigo-300/80" strokeWidth={2} />
            <span className="min-w-0 truncate font-mono text-[13px] text-neutral-200">{client.email}</span>
          </div>
          {client.phone ? (
            <div className="flex items-center gap-2.5 text-xs text-neutral-400">
              <Phone className="h-3.5 w-3.5 shrink-0 text-neutral-500" strokeWidth={2} />
              <span className="font-mono text-[12px]">{client.phone}</span>
            </div>
          ) : null}
          {client.siret ? (
            <div className="flex items-center gap-2.5 text-xs text-neutral-500">
              <Hash className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <span className="font-mono text-[11px] tracking-wide">{client.siret}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-auto flex flex-wrap gap-2 border-t border-white/6 pt-4">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/18 bg-white/[0.04] px-3 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-all hover:border-white/30 hover:bg-white/[0.08] min-[420px]:flex-none min-[420px]:px-5"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
            Modifier
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-400/35 bg-red-500/10 px-3 py-2.5 text-xs font-bold uppercase tracking-widest text-red-100 transition-all hover:border-red-400/55 hover:bg-red-500/20 min-[420px]:flex-none min-[420px]:px-5"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            Supprimer
          </button>
        </div>
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
  const [form, setForm] = useState({
    companyName: "",
    headOfficeAddress: "",
    siret: "",
    managerName: "",
    phone: "",
    email: "",
    clientType: "paire",
    notes: "",
    password: "",
  });

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
    try {
      await apiFetch("/clients", { method: "POST", body: JSON.stringify(form) }, token);
      showFeedback("Client créé avec succès.", "success");
      setForm({ companyName: "", headOfficeAddress: "", siret: "", managerName: "", phone: "", email: "", clientType: "paire", notes: "", password: "" });
      load();
    } catch (err: any) {
      showFeedback(err.message || "Erreur lors de la création du client.", "error");
    }
  }

  function startEdit(client: any) {
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
    try {
      await apiFetch(
        `/clients/${editingId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            companyName: form.companyName,
            headOfficeAddress: form.headOfficeAddress,
            siret: form.siret,
            managerName: form.managerName,
            phone: form.phone,
            email: form.email,
            clientType: form.clientType,
            notes: form.notes,
          }),
        },
        token
      );
      showFeedback("Client modifié avec succès.", "success");
      setEditingId(null);
      setForm({ companyName: "", headOfficeAddress: "", siret: "", managerName: "", phone: "", email: "", clientType: "paire", notes: "", password: "" });
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
        setForm({ companyName: "", headOfficeAddress: "", siret: "", managerName: "", phone: "", email: "", clientType: "paire", notes: "", password: "" });
      }
      load();
    } catch (err: any) {
      showFeedback(err.message || "Erreur lors de la suppression.", "error");
    }
  }

  function cancelEdit() {
    setEditingId(null);
    showFeedback("Modification annulée.", "info");
    setForm({ companyName: "", headOfficeAddress: "", siret: "", managerName: "", phone: "", email: "", clientType: "paire", notes: "", password: "" });
  }

  return (
    <AdminY2KLayout>
      <div className="flex-1 overflow-y-auto pb-12">
        <header className="mb-8 flex flex-col gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-violet-300/80">Annuaire</p>
          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">Clients</h1>
          <p className="max-w-2xl text-sm text-neutral-400">
            Création d&apos;accès espace membre, profil semaine (paire / impaire / VIP) et suivi des coordonnées.
          </p>
        </header>

        <ChromeCard
          title={editingId ? "Modifier le client" : "Nouveau client"}
          subtitle={editingId ? "Les champs sont préremplis — le mot de passe ne se modifie pas ici." : "Création du compte d'accès membre."}
          className="mb-10 border-white/10"
        >
          <form onSubmit={editingId ? submitEdit : submit} className="grid gap-5 md:grid-cols-2">
            <Field label="Entreprise *">
              <input
                className={inputClass}
                placeholder="Nom entreprise"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                required
              />
            </Field>
            <Field label="Adresse du siège">
              <input
                className={inputClass}
                placeholder="Adresse complète"
                value={form.headOfficeAddress}
                onChange={(e) => setForm({ ...form, headOfficeAddress: e.target.value })}
              />
            </Field>
            <Field label="SIRET">
              <input className={inputClass} placeholder="Siret" value={form.siret} onChange={(e) => setForm({ ...form, siret: e.target.value })} />
            </Field>
            <Field label="Dirigeant / contact">
              <input
                className={inputClass}
                placeholder="Nom du dirigeant"
                value={form.managerName}
                onChange={(e) => setForm({ ...form, managerName: e.target.value })}
              />
            </Field>
            <Field label="Téléphone">
              <input className={inputClass} placeholder="+33…" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="E-mail (identifiant connexion) *">
              <input
                className={inputClass}
                placeholder="contact@entreprise.fr"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </Field>
            <Field label="Règle calendrier (P2C)">
              <select className={cn(inputClass, "cursor-pointer")} value={form.clientType} onChange={(e) => setForm({ ...form, clientType: e.target.value })}>
                <option value="paire">Semaine paire</option>
                <option value="impaire">Semaine impaire</option>
                <option value="vip">VIP</option>
              </select>
            </Field>
            <Field label={editingId ? "Mot de passe" : "Mot de passe initial *"}>
              <PasswordInput
                placeholder={editingId ? "inchangé depuis cet écran" : "Mot de passe transmis au client"}
                value={form.password}
                onChange={(password) => setForm({ ...form, password })}
                required={!editingId}
                disabled={!!editingId}
              />
            </Field>
            <Field label="Notes internes" className="md:col-span-2">
              <textarea
                className={cn(inputClass, "min-h-[100px] resize-y py-3")}
                placeholder="Informations utiles pour l'équipe…"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
                <span className="order-2 hidden text-[11px] text-neutral-600 md:order-1 md:inline">Les champs * sont obligatoires.</span>
              )}
              <button
                type="submit"
                className="order-1 inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-300/35 bg-gradient-to-r from-indigo-600/35 via-violet-600/28 to-indigo-600/35 px-6 py-3.5 text-xs font-black uppercase tracking-[0.12em] text-white shadow-[0_0_28px_-8px_rgba(99,102,241,0.45)] transition-all hover:border-indigo-200/45 hover:from-indigo-500/45 hover:to-violet-500/35 md:order-2 md:min-w-[280px]"
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

        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold uppercase tracking-wide text-white">Clients enregistrés</h2>
            <p className="mt-1 text-xs text-neutral-500">{clients.length} fiche{clients.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
