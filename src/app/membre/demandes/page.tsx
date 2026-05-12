/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Calendar, Clock, Radio } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { MemberY2KLayout } from "@/components/member/MemberY2KLayout";
import { ChromeCard } from "@/components/admin/Y2KAdminLayout";
import {
  StatusBadge,
  axisLabelFr,
  formatRequestDateLong,
  slotLabelFromRequest,
} from "@/components/admin/demandeUi";

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
      <div className="mx-auto w-full min-w-0 max-w-3xl space-y-5 px-0 sm:space-y-6">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-300/80">Suivi</p>
          <h2 className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl md:text-4xl">
            Mes demandes P2C
          </h2>
          <p className="text-xs leading-relaxed text-neutral-400 sm:text-sm">
            Retrouvez ici le statut de chaque demande dès que vous êtes connecté : en attente, validée, refusée ou à
            compléter.
          </p>
        </div>

        <p className="text-[11px] text-neutral-500 sm:text-xs">
          <Link href="/membre/p2c" className="text-violet-300 underline-offset-4 hover:text-white hover:underline">
            ← Nouvelle demande (calendrier P2C)
          </Link>
        </p>

        {loading ? (
          <p className="font-mono text-xs text-neutral-500 sm:text-sm">Chargement…</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-10 text-center text-xs leading-relaxed text-neutral-400 sm:px-6 sm:py-12 sm:text-sm">
            Aucune demande pour le moment. Envoyez votre première demande depuis la page{" "}
            <Link href="/membre/p2c" className="text-violet-300 hover:underline">
              P2C mensuel
            </Link>
            .
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((r) => (
              <li key={r._id}>
                <ChromeCard className="min-w-0 border-white/10">
                  <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                          {r.company || "Demande"}
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
