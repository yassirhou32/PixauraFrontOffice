"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Building2,
  Calendar,
  Clock,
  Radio,
  Sparkles,
} from "lucide-react";
import { ChromeCard } from "@/components/admin/Y2KAdminLayout";
import { FALLBACK_DAY_SLOTS } from "@/lib/calendarClient";
import { cn } from "@/lib/utils";

export const STATUS_LABEL_FR: Record<string, string> = {
  validee: "Validée",
  en_attente: "En attente",
  refusee: "Refusée",
  a_completer: "À compléter",
};

import { axisLabelFr as axisLabelFrShared } from "@/lib/communicationAxes";

const CLIENT_TYPE_LABEL_FR: Record<string, string> = {
  paire: "Semaine paire",
  impaire: "Semaine impaire",
  vip: "VIP",
};

export function statusBadgeClass(status: string) {
  switch (status) {
    case "validee":
      return "border-emerald-400/40 bg-emerald-500/15 text-emerald-100 shadow-[0_0_20px_-8px_rgba(52,211,153,0.5)]";
    case "en_attente":
      return "border-amber-400/40 bg-amber-500/12 text-amber-50 shadow-[0_0_20px_-8px_rgba(251,191,36,0.35)]";
    case "refusee":
      return "border-red-400/35 bg-red-500/12 text-red-100";
    case "a_completer":
      return "border-sky-400/35 bg-sky-500/12 text-sky-50";
    default:
      return "border-white/20 bg-white/5 text-neutral-200";
  }
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const label = STATUS_LABEL_FR[status] || status;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest",
        statusBadgeClass(status),
        className
      )}
    >
      {label}
    </span>
  );
}

export function clientTypePill(type: string | undefined) {
  const t = type || "";
  const label = CLIENT_TYPE_LABEL_FR[t] || t || "—";
  return (
    <span className="inline-flex items-center rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-violet-200">
      {label}
    </span>
  );
}

export function formatRequestDateLong(iso: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "long", year: "numeric" }).format(
      new Date(iso)
    );
  } catch {
    return "—";
  }
}

export function formatRequestDateShort(iso: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export function slotLabelFromRequest(timeSlotId: string | undefined, requestedTime?: string) {
  if (timeSlotId === "journee-complete") return "Journée complète (5 créneaux)";
  const def = FALLBACK_DAY_SLOTS.find((s) => s.id === timeSlotId);
  if (def) return def.label;
  if (timeSlotId) return timeSlotId;
  if (requestedTime) return requestedTime.slice(0, 5);
  return "—";
}

export function axisLabelFr(axis: string) {
  return axisLabelFrShared(axis);
}

export function DetailSection({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-5 backdrop-blur-sm",
        className
      )}
    >
      <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-violet-300">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">{title}</h2>
      </div>
      <div className="space-y-3 text-sm leading-relaxed text-neutral-200">{children}</div>
    </section>
  );
}

export function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <span className="shrink-0 text-[11px] font-mono uppercase tracking-wider text-neutral-500">{label}</span>
      <span className={cn("min-w-0 text-neutral-100", mono && "font-mono text-xs text-neutral-300")}>{value}</span>
    </div>
  );
}

export type DemandeListItem = {
  _id: string;
  status: string;
  communicationAxis: string;
  requestedDate: string;
  timeSlotId?: string;
  requestedTime?: string;
  client?: { companyName?: string; clientType?: string };
};

export function DemandRequestCard({ item }: { item: DemandeListItem }) {
  const company = item.client?.companyName || "Client inconnu";
  const shortId = String(item._id).slice(-6).toUpperCase();
  const slot = slotLabelFromRequest(item.timeSlotId, item.requestedTime);

  return (
    <Link href={`/admin/demandes/${item._id}`} className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-[28px]">
      <ChromeCard className="h-full border-white/10 transition-all duration-300 group-hover:border-white/20 group-hover:bg-neutral-900/50">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Building2 className="h-5 w-5 shrink-0 text-neutral-500 transition-colors group-hover:text-violet-300" strokeWidth={1.5} />
                <h3 className="truncate text-xl font-black uppercase tracking-tight text-white">{company}</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Demande · {shortId}</span>
                {clientTypePill(item.client?.clientType)}
              </div>
            </div>
            <StatusBadge status={item.status} className="shrink-0" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-black/25 px-3 py-3">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300/90" strokeWidth={1.75} />
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Date</p>
                <p className="mt-0.5 text-sm font-semibold text-neutral-100">{formatRequestDateLong(item.requestedDate)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-black/25 px-3 py-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300/90" strokeWidth={1.75} />
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Créneau</p>
                <p className="mt-0.5 text-sm font-semibold text-neutral-100">{slot}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-black/25 px-3 py-3">
              <Radio className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300/90" strokeWidth={1.75} />
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Axe</p>
                <p className="mt-0.5 text-sm font-semibold text-neutral-100">{axisLabelFr(item.communicationAxis)}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-1">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-300/90 transition-colors group-hover:text-white">
              Voir le détail
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            </span>
            <Sparkles className="h-4 w-4 text-white/10 transition-colors group-hover:text-violet-400/40" strokeWidth={1.5} />
          </div>
        </div>
      </ChromeCard>
    </Link>
  );
}