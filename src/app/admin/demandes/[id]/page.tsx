/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  ClipboardList,
  MapPin,
  User,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import { useParams, useRouter } from "next/navigation";
import { AdminY2KLayout, ChromeCard } from "@/components/admin/Y2KAdminLayout";
import {
  DetailSection,
  InfoRow,
  StatusBadge,
  STATUS_LABEL_FR,
  axisLabelFr,
  clientTypePill,
  formatRequestDateLong,
  slotLabelFromRequest,
  statusBadgeClass,
} from "@/components/admin/demandeUi";
import { cn } from "@/lib/utils";

const STATUSES = ["en_attente", "validee", "refusee", "a_completer"] as const;

export default function DemandeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "admin") return router.push("/login");
    const token = getToken();
    apiFetch(`/requests/${params.id}`, {}, token).then(setItem);
  }, [params.id, router]);

  async function changeStatus(status: string) {
    const token = getToken();
    const updated = await apiFetch<{ emailStatus?: { sent: boolean; reason?: string } }>(
      `/requests/${params.id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
      token
    );
    setItem(updated);
    if (status === "validee" && updated.emailStatus && !updated.emailStatus.sent) {
      window.alert(
        `Demande validée, mais l'e-mail de confirmation n'a pas pu être envoyé : ${updated.emailStatus.reason || "erreur inconnue"}`
      );
    }
  }

  const display = (v: string | undefined | null) => (v && String(v).trim() ? v : "—");

  return (
    <AdminY2KLayout>
      <div className="flex-1 space-y-6 overflow-y-auto pb-12">
        <Link
          href="/admin/demandes"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-500 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Retour aux demandes
        </Link>

        {!item ? (
          <p className="font-mono text-sm text-neutral-500">Chargement…</p>
        ) : (
          <>
            <header className="flex flex-col gap-4 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-violet-300/80">Fiche demande</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Building2 className="h-8 w-8 shrink-0 text-neutral-600" strokeWidth={1.25} />
                  <h1 className="text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
                    {item.client?.companyName || "Client"}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {clientTypePill(item.client?.clientType)}
                  <span className="font-mono text-[10px] text-neutral-600">· ID {String(item._id).slice(-8)}</span>
                </div>
              </div>
              <StatusBadge status={item.status} className="self-start text-xs" />
            </header>

            <div className="grid gap-5 lg:grid-cols-2">
              <DetailSection icon={User} title="Contact & entreprise">
                <InfoRow label="Raison sociale" value={display(item.client?.companyName)} />
                <InfoRow label="Contact principal" value={display(item.mainContact)} />
                <InfoRow label="Email" value={display(item.email)} mono />
                <InfoRow label="Téléphone" value={display(item.phone)} mono />
              </DetailSection>

              <DetailSection icon={CalendarClock} title="Séance planifiée">
                <InfoRow label="Date" value={formatRequestDateLong(item.requestedDate)} />
                <InfoRow
                  label="Créneau"
                  value={slotLabelFromRequest(item.timeSlotId, item.requestedTime)}
                  mono
                />
                <InfoRow label="Axe communication" value={axisLabelFr(item.communicationAxis)} />
              </DetailSection>

              <DetailSection icon={ClipboardList} title="Projet" className="lg:col-span-2">
                <InfoRow label="Détails" value={<span className="whitespace-pre-wrap">{display(item.projectDetails)}</span>} />
              </DetailSection>

              <DetailSection icon={MapPin} title="Lieu & logistique" className="lg:col-span-2">
                <InfoRow label="Adresse tournage" value={display(item.shootingAddress)} />
                <InfoRow label="Contraintes techniques" value={display(item.technicalConstraints)} />
                <InfoRow label="Contact sur place" value={display(item.onsiteContact)} />
                <InfoRow label="Commentaire libre" value={display(item.freeComment)} />
              </DetailSection>
            </div>

            <ChromeCard title="Actions administrateur" subtitle="Mettre à jour le statut de la demande" className="border-white/10">
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => {
                  const active = item.status === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => changeStatus(s)}
                      className={cn(
                        "rounded-full border px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all",
                        statusBadgeClass(s),
                        active && "ring-2 ring-white/40 ring-offset-2 ring-offset-black"
                      )}
                    >
                      {STATUS_LABEL_FR[s] || s}
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-[11px] font-mono text-neutral-500">
                Le statut « Validée » réserve le créneau pour les autres clients.
              </p>
            </ChromeCard>
          </>
        )}
      </div>
    </AdminY2KLayout>
  );
}
