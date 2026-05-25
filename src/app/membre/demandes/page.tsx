/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Calendar, Clock, Pencil, Radio } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  MemberDemandesHero,
  MemberEmptyStateVisual,
  MemberRequestCardVisual,
} from "@/components/member/MemberBrandImagery";
import { MemberY2KLayout } from "@/components/member/MemberY2KLayout";
import { ChromeCard } from "@/components/admin/Y2KAdminLayout";
import {
  StatusBadge,
  axisLabelFr,
  formatRequestDateLong,
  slotLabelFromRequest,
} from "@/components/admin/demandeUi";

const EDITABLE_STATUSES = new Set(["en_attente", "a_completer"]);

const STATUS_HELP: Record<string, string> = {
  en_attente: "Votre demande est en cours d'examen par Pixaura.",
  validee: "Votre créneau est confirmé. Le détail figure ci-dessous.",
  refusee: "Ce créneau n'a pas pu être retenu. Vous pouvez proposer une autre date depuis P2C ou contacter Pixaura.",
  a_completer: "Pixaura a besoin d'informations complémentaires sur votre dossier.",
};

export default function MembreDemandesPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "client") {
      router.push("/login");
      return;
    }
    let cancelled = false;
    const t = getToken();
    apiFetch<any[]>("/requests/me", {}, t)
      .then((data) => {
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <MemberY2KLayout>
      <div className="mx-auto w-full min-w-0 max-w-4xl space-y-6 px-0 sm:space-y-8">
        <MemberDemandesHero
          eyebrow="Suivi client"
          title="Mes demandes P2C"
          description="Statut en temps réel : en attente, validée, refusée ou à compléter. Chaque demande reste liée à votre contact et à votre créneau Pixaura."
        />

        <p className="text-[11px] text-neutral-500 sm:text-xs">
          <Link href="/membre/p2c" className="text-violet-300 underline-offset-4 hover:text-white hover:underline">
            ← Nouvelle demande (calendrier P2C)
          </Link>
        </p>

        {loading ? (
          <p className="font-mono text-xs text-neutral-500 sm:text-sm">Chargement…</p>
        ) : items.length === 0 ? (
          <div className="space-y-5">
            <MemberEmptyStateVisual />
            <p className="text-center text-sm text-neutral-400">
              <Link href="/membre/p2c" className="font-semibold text-violet-300 hover:text-white hover:underline">
                Créer une demande P2C →
              </Link>
            </p>
          </div>
        ) : (
          <ul className="space-y-5">
            {items.map((r, i) => (
              <li key={r._id}>
                <ChromeCard className="min-w-0 overflow-hidden border-white/10">
                  <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:gap-5">
                    <MemberRequestCardVisual index={i} />
                    <div className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4">
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                          {r.company || "Demande"}
                          {r.p2cSlot === 1 || r.p2cSlot === 2 ? (
                            <span className="ml-2 text-violet-300/90">· Projet {r.p2cSlot}</span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          Créée le{" "}
                          {r.createdAt
                            ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(
                                new Date(r.createdAt)
                              )
                            : "—"}
                        </p>
                      </div>
                      <div className="shrink-0 self-start sm:self-auto">
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                    <p className="min-w-0 text-xs leading-relaxed text-neutral-300 sm:text-sm">{STATUS_HELP[r.status] || r.status}</p>
                    <div className="grid min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
                      <div className="flex min-w-0 items-start gap-2 rounded-xl border border-white/8 bg-black/30 px-2.5 py-2 sm:px-3 sm:py-2.5">
                        <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300/90" strokeWidth={1.75} />
                        <div className="min-w-0">
                          <p className="text-[9px] font-mono uppercase tracking-wider text-neutral-500">Date</p>
                          <p className="min-w-0 break-words text-xs font-semibold text-neutral-100">{formatRequestDateLong(r.requestedDate)}</p>
                        </div>
                      </div>
                      <div className="flex min-w-0 items-start gap-2 rounded-xl border border-white/8 bg-black/30 px-2.5 py-2 sm:px-3 sm:py-2.5">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300/90" strokeWidth={1.75} />
                        <div className="min-w-0">
                          <p className="text-[9px] font-mono uppercase tracking-wider text-neutral-500">Créneau</p>
                          <p className="min-w-0 break-words text-xs font-semibold text-neutral-100">
                            {slotLabelFromRequest(r.timeSlotId, r.requestedTime)}
                          </p>
                        </div>
                      </div>
                      <div className="flex min-w-0 items-start gap-2 rounded-xl border border-white/8 bg-black/30 px-2.5 py-2 sm:px-3 sm:py-2.5">
                        <Radio className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300/90" strokeWidth={1.75} />
                        <div className="min-w-0">
                          <p className="text-[9px] font-mono uppercase tracking-wider text-neutral-500">Axe</p>
                          <p className="min-w-0 break-words text-xs font-semibold text-neutral-100">{axisLabelFr(r.communicationAxis)}</p>
                        </div>
                      </div>
                    </div>
                    {EDITABLE_STATUSES.has(r.status) ? (
                      <Link
                        href={`/membre/demandes/${r._id}/modifier`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-violet-400/35 bg-violet-500/15 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-violet-100 transition-colors hover:bg-violet-500/25 sm:text-sm"
                      >
                        <Pencil className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                        Modifier la demande
                      </Link>
                    ) : null}
                    </div>
                  </div>
                </ChromeCard>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MemberY2KLayout>
  );
}
