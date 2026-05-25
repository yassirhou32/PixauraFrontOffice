/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  CartesianGrid,
} from "recharts";
import { Zap, ActivitySquare } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AdminY2KLayout, ChromeCard } from "@/components/admin/Y2KAdminLayout";
import GalleryDiagonalMarquee from "@/components/admin/GalleryDiagonalMarquee";
import {
  StatusBadge,
  axisLabelFr,
  clientTypePill,
  formatRequestDateShort,
} from "@/components/admin/demandeUi";

type DashboardStats = {
  total: number;
  en_attente: number;
  validee: number;
  refusee: number;
  clientsActifs: number;
};

type RequestRow = {
  _id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

function dayBounds(d: Date) {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function inHalfOpenRange(t: Date, start: Date, end: Date) {
  return t >= start && t < end;
}

/** Série temporelle réelle : demandes créées vs validations (updatedAt, statut validee). */
function buildTelemetrySeries(
  requests: RequestRow[],
  period: "daily" | "monthly" | "yearly"
): { name: string; demandes: number; validees: number }[] {
  const now = new Date();

  if (period === "daily") {
    const out: { name: string; demandes: number; validees: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const { start, end } = dayBounds(d);
      const demandes = requests.filter((r) => inHalfOpenRange(new Date(r.createdAt), start, end)).length;
      const validees = requests.filter(
        (r) => r.status === "validee" && inHalfOpenRange(new Date(r.updatedAt), start, end)
      ).length;
      const name = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
      out.push({ name, demandes, validees });
    }
    return out;
  }

  if (period === "monthly") {
    const y = now.getFullYear();
    const m = now.getMonth();
    const dim = new Date(y, m + 1, 0).getDate();
    const parts = 4;
    const out: { name: string; demandes: number; validees: number }[] = [];
    for (let i = 0; i < parts; i++) {
      const startDay = Math.floor((i * dim) / parts) + 1;
      const endDay = Math.floor(((i + 1) * dim) / parts);
      const start = new Date(y, m, startDay, 0, 0, 0, 0);
      const end = new Date(y, m, endDay + 1, 0, 0, 0, 0);
      const demandes = requests.filter((r) => inHalfOpenRange(new Date(r.createdAt), start, end)).length;
      const validees = requests.filter(
        (r) => r.status === "validee" && inHalfOpenRange(new Date(r.updatedAt), start, end)
      ).length;
      out.push({ name: `Sem. ${i + 1}`, demandes, validees });
    }
    return out;
  }

  const y = now.getFullYear();
  const out: { name: string; demandes: number; validees: number }[] = [];
  for (let month = 0; month < 12; month++) {
    const start = new Date(y, month, 1, 0, 0, 0, 0);
    const end = new Date(y, month + 1, 1, 0, 0, 0, 0);
    if (start > now) break;
    const demandes = requests.filter((r) => inHalfOpenRange(new Date(r.createdAt), start, end)).length;
    const validees = requests.filter(
      (r) => r.status === "validee" && inHalfOpenRange(new Date(r.updatedAt), start, end)
    ).length;
    const name = start.toLocaleDateString("fr-FR", { month: "short" });
    out.push({ name, demandes, validees });
  }
  return out;
}

/** Radar : forme normalisée (0–100) pour la lisibilité ; valeurs brutes dans l’infobulle. */
function buildRadarRows(requests: RequestRow[], clientsActifs: number): { subject: string; A: number; raw: number }[] {
  let enAttente = 0;
  let validee = 0;
  let refusee = 0;
  let aCompleter = 0;
  for (const r of requests) {
    if (r.status === "en_attente") enAttente += 1;
    else if (r.status === "validee") validee += 1;
    else if (r.status === "refusee") refusee += 1;
    else if (r.status === "a_completer") aCompleter += 1;
  }
  const total = requests.length;
  const rawRows = [
    { subject: "Demandes", raw: total },
    { subject: "Validées", raw: validee },
    { subject: "En attente", raw: enAttente },
    { subject: "Refusées", raw: refusee },
    { subject: "À compléter", raw: aCompleter },
    { subject: "Clients", raw: clientsActifs },
  ];
  const max = Math.max(...rawRows.map((r) => r.raw), 1);
  return rawRows.map((r) => ({ subject: r.subject, raw: r.raw, A: (r.raw / max) * 100 }));
}

const CHART_PERIODS = [
  { id: "daily" as const, label: "Jour" },
  { id: "monthly" as const, label: "Mois" },
  { id: "yearly" as const, label: "Année" },
];

function ChartPeriodPicker({
  value,
  onChange,
  className,
}: {
  value: "daily" | "monthly" | "yearly";
  onChange: (id: "daily" | "monthly" | "yearly") => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 gap-1 rounded-xl border border-white/15 bg-black/35 p-1 sm:w-auto sm:gap-1.5",
        className
      )}
      role="group"
      aria-label="Période du graphique"
    >
      {CHART_PERIODS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "min-h-[36px] flex-1 rounded-lg px-3 py-2 text-[10px] font-mono font-semibold uppercase tracking-wider transition-colors sm:min-h-0 sm:flex-none sm:px-4 sm:py-2 sm:text-[11px]",
            value === id
              ? "bg-white text-black shadow-[0_0_16px_rgba(255,255,255,0.12)]"
              : "text-neutral-400 hover:bg-white/10 hover:text-white"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

type JournalRequest = {
  _id: string;
  status: string;
  requestedDate: string;
  communicationAxis?: string;
  client?: { companyName?: string; clientType?: string };
};

function RequestJournal({ requests }: { requests: JournalRequest[] }) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20">
        <p className="font-mono text-sm text-neutral-500">Aucune demande enregistrée pour le moment.</p>
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3 p-4 sm:hidden">
        {requests.map((log) => (
          <li
            key={log._id}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 flex-1 text-base font-bold leading-snug text-indigo-300">
                {log.client?.companyName || "—"}
              </p>
              <StatusBadge status={log.status} className="shrink-0 text-[10px]" />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 font-mono text-[11px]">
              <div>
                <dt className="text-neutral-500">Type</dt>
                <dd className="mt-1">{clientTypePill(log.client?.clientType)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Date</dt>
                <dd className="mt-1 text-neutral-200">{formatRequestDateShort(log.requestedDate)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-neutral-500">Axe</dt>
                <dd className="mt-1 text-neutral-200">{axisLabelFr(log.communicationAxis || "")}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <div className="hidden min-h-0 flex-1 overflow-auto sm:block">
        <table className="w-full min-w-0 text-left">
          <thead className="sticky top-0 z-10 border-b border-white/10 bg-neutral-950/95 backdrop-blur-md">
            <tr>
              <th className="py-4 pl-6 pr-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 md:py-5 md:pl-10">
                Client
              </th>
              <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 md:py-5">
                Type
              </th>
              <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 md:py-5">
                Date
              </th>
              <th className="hidden px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 md:table-cell md:py-5">
                Axe
              </th>
              <th className="py-4 pl-4 pr-6 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 md:py-5 md:pr-10">
                Statut
              </th>
            </tr>
          </thead>
          <tbody>
            {requests.map((log, rowIdx) => (
              <tr
                key={log._id}
                className={cn(
                  "border-b border-white/[0.06] transition-colors last:border-0 hover:bg-white/[0.05]",
                  rowIdx % 2 === 1 && "bg-white/[0.02]"
                )}
              >
                <td className="py-4 pl-6 pr-4 md:py-5 md:pl-10">
                  <span className="text-sm font-semibold text-indigo-300 md:text-[15px]">
                    {log.client?.companyName || "—"}
                  </span>
                </td>
                <td className="px-4 py-4 md:py-5">{clientTypePill(log.client?.clientType)}</td>
                <td className="whitespace-nowrap px-4 py-4 font-mono text-sm text-neutral-300 md:py-5">
                  {formatRequestDateShort(log.requestedDate)}
                </td>
                <td className="hidden px-4 py-4 text-sm text-neutral-300 md:table-cell md:py-5">
                  {axisLabelFr(log.communicationAxis || "")}
                </td>
                <td className="py-4 pl-4 pr-6 text-right md:py-5 md:pr-10">
                  <StatusBadge status={log.status} className="ml-auto inline-flex" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function TelemetryLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 gap-y-2 font-mono text-[10px] uppercase tracking-wide text-neutral-400 sm:justify-start sm:text-[11px]">
      <span className="inline-flex items-center gap-2">
        <span className="h-0.5 w-6 rounded-full bg-white" />
        Demandes créées
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-0.5 w-6 rounded-full border-t-2 border-dashed border-indigo-400" />
        Validées
      </span>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [chartPeriod, setChartPeriod] = useState<"daily" | "monthly" | "yearly">("monthly");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "admin") return router.push("/login");
    const token = getToken();
    Promise.all([apiFetch<DashboardStats>("/admin/dashboard", {}, token), apiFetch<any[]>("/requests", {}, token)])
      .then(([dash, reqs]) => {
        setStats(dash);
        setRequests(reqs);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const chartData = useMemo(
    () => buildTelemetrySeries(requests as RequestRow[], chartPeriod),
    [requests, chartPeriod]
  );

  const radarData = useMemo(
    () => buildRadarRows(requests as RequestRow[], stats?.clientsActifs ?? 0),
    [requests, stats?.clientsActifs]
  );

  const cardShell =
    "rounded-[1.75rem] border border-white/[0.12] bg-neutral-900/55 shadow-[0_20px_64px_-32px_rgba(0,0,0,0.88)] ring-1 ring-white/[0.06] sm:rounded-[1.85rem] md:rounded-[2rem] md:border-white/[0.14] md:shadow-[0_28px_90px_-40px_rgba(0,0,0,0.9)]";
  const cardInner = "p-5 sm:p-6 md:p-8 lg:p-9";
  const chartPanel =
    "overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-black/35 via-black/20 to-transparent p-2 sm:p-4 md:p-5";

  return (
    <AdminY2KLayout>
      <div className="flex h-full min-h-0 flex-col md:max-w-[1680px] md:mx-auto md:w-full">
      <header className="mb-4 shrink-0 sm:mb-6 md:mb-10 lg:mb-12">
        <div className="min-w-0 md:flex md:items-end md:justify-between md:gap-8">
          <div>
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.3em] text-violet-300/80 sm:mb-2 sm:text-[11px] sm:tracking-[0.35em]">
              Tableau de bord
            </p>
            <h1 className="mb-1 text-3xl font-black leading-tight tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 sm:mb-2 sm:text-4xl md:text-5xl lg:text-6xl">
              PIXAURA
            </h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-widest text-neutral-400 sm:text-xs md:mt-3 md:gap-x-3">
              <div className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-green-400 shadow-[0_0_10px_#4ade80]" />
              <span className="min-w-0">Backoffice connecté</span>
              <span className="text-neutral-600">|</span>
              <span>v.1.0.0</span>
            </div>
          </div>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-neutral-500 sm:text-sm md:mt-0 md:text-right">
            Vue synthétique des demandes P2C, validations et activité clients.
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl pb-8 pr-1 scrollbar-none sm:rounded-[32px] sm:pr-2 sm:pb-10 md:rounded-[2.5rem] md:pb-14 md:pr-4">
        <div className="flex flex-col gap-5 pb-4 sm:gap-7 md:gap-10 lg:gap-12">
              {/*
                Mobile : une carte = une ligne (évite grille / h-full qui écrase sous Safari).
                md+ : grille desktop inchangée.
              */}
              <div className="flex shrink-0 flex-col gap-5 sm:gap-6 md:grid md:grid-cols-2 md:gap-8 lg:grid-cols-4 lg:gap-10">
                <ChromeCard
                  className={cn(
                    "w-full min-w-0 shrink-0 bg-gradient-to-br from-indigo-950/50 via-neutral-900/40 to-purple-950/40",
                    "md:col-span-2 md:min-h-[220px] lg:min-h-[248px]",
                    cardShell,
                    "ring-indigo-500/10 md:ring-indigo-500/15"
                  )}
                  innerClassName={cardInner}
                  title="Demandes totales"
                  subtitle="Vue opérationnelle"
                >
                  <div className="relative z-10 flex min-h-0 flex-col gap-6 sm:h-full sm:flex-row sm:items-start sm:justify-between sm:gap-4 md:gap-8">
                    <div className="flex min-h-0 flex-col justify-between gap-4 sm:h-full sm:gap-0 md:py-1">
                      <div className="flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 backdrop-blur-md md:px-4 md:py-1.5">
                        <Zap className="h-4 w-4 shrink-0 text-yellow-300 md:h-5 md:w-5" />
                        <span className="text-xs font-bold uppercase md:text-[13px]">Total demandes</span>
                      </div>
                      <div>
                        <h2 className="text-4xl font-black tracking-tighter text-glow sm:text-5xl md:text-6xl lg:text-7xl">
                          {stats?.total ?? 0}
                        </h2>
                        <p className="mt-2 font-mono text-neutral-400 md:mt-4 md:text-sm">P2C enregistrés</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-end justify-center gap-1 self-center sm:h-full sm:self-end sm:justify-end md:gap-1.5">
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [20, 60, 20] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                          className="w-3 rounded-t-full bg-gradient-to-t from-indigo-400/30 to-white/25 sm:w-4 md:w-[18px]"
                        />
                      ))}
                    </div>
                  </div>
                </ChromeCard>

                {[
                  {
                    label: "Clients actifs",
                    val: String(stats?.clientsActifs ?? 0),
                    trend: "en ligne",
                    accent: "from-emerald-500/20 to-transparent",
                    bar: "bg-emerald-400/90",
                  },
                  {
                    label: "En attente",
                    val: String(stats?.en_attente ?? 0),
                    trend: "à traiter",
                    accent: "from-amber-500/20 to-transparent",
                    bar: "bg-amber-400/90",
                  },
                  {
                    label: "Validées",
                    val: String(stats?.validee ?? 0),
                    trend: "confirmées",
                    accent: "from-violet-500/20 to-transparent",
                    bar: "bg-violet-400/90",
                  },
                  {
                    label: "Refusées",
                    val: String(stats?.refusee ?? 0),
                    trend: "archivées",
                    accent: "from-rose-500/20 to-transparent",
                    bar: "bg-rose-400/80",
                  },
                ].map((stat, i) => (
                  <ChromeCard
                    key={stat.label}
                    className={cn(
                      "flex w-full min-w-0 shrink-0 flex-col justify-between sm:min-h-[168px] md:h-full md:min-h-[200px]",
                      cardShell
                    )}
                    innerClassName={cardInner}
                    title={stat.label}
                    subtitle={stat.trend}
                  >
                    <div
                      className={cn(
                        "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60 md:opacity-80",
                        stat.accent
                      )}
                    />
                    <div className="relative flex min-h-0 flex-col justify-between gap-3 md:h-full md:gap-6">
                      <p className="font-mono text-xs uppercase text-neutral-400 md:hidden">{stat.label}</p>
                      <div className="flex items-end justify-between gap-3 md:mt-2">
                        <h3 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{stat.val}</h3>
                        <div className="shrink-0 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-neutral-300 md:px-3 md:py-1.5 md:text-xs">
                          {stat.trend}
                        </div>
                      </div>
                      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/10 md:mt-0 md:h-1.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "70%" }}
                          transition={{ delay: 0.3 + i * 0.1 }}
                          className={cn("h-full shadow-[0_0_12px_rgba(255,255,255,0.35)]", stat.bar)}
                        />
                      </div>
                    </div>
                  </ChromeCard>
                ))}

                <div
                  className={cn(
                    "w-full min-w-0 shrink-0 overflow-x-hidden rounded-2xl border border-white/10 md:col-span-2 lg:col-span-4",
                    cardShell
                  )}
                >
                  <GalleryDiagonalMarquee />
                </div>

                <ChromeCard
                  className={cn(
                    "min-h-0 w-full min-w-0 shrink-0 md:col-span-2 lg:col-span-3 lg:min-h-[440px]",
                    cardShell
                  )}
                  innerClassName={cn(cardInner, "relative md:pb-10")}
                  title="Télémétrie système"
                  subtitle="Demandes créées vs validations (données réelles)"
                >
                  <div className="relative z-20 flex flex-col gap-4 md:absolute md:right-8 md:top-8 md:mb-0 md:w-[min(100%,280px)] md:items-end">
                    <ChartPeriodPicker value={chartPeriod} onChange={setChartPeriod} />
                  </div>
                  <div className="flex flex-col gap-3 md:gap-5 md:pt-14 lg:pt-16">
                    <TelemetryLegend />
                    <div className={cn(chartPanel, "h-[252px] w-full min-w-0 sm:h-[288px] md:h-[320px] lg:h-[340px]")}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorDemandes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#fff" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#fff" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis
                          dataKey="name"
                          stroke="#525252"
                          tick={{ fontFamily: "Montserrat, sans-serif", fontSize: 10, fill: "#a3a3a3" }}
                          tickLine={false}
                          axisLine={false}
                          dy={8}
                          interval="preserveStartEnd"
                        />
                        <YAxis hide />
                        <Tooltip
                          cursor={{ stroke: "rgba(255,255,255,0.2)" }}
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const row = payload[0]?.payload as { demandes?: number; validees?: number };
                            return (
                              <div
                                className="rounded-lg border border-white/20 bg-black px-3 py-2 font-mono text-xs text-white shadow-xl"
                              >
                                <p className="mb-1 text-neutral-400">{label}</p>
                                <p>Demandes créées : {row.demandes ?? 0}</p>
                                <p className="text-indigo-300">Validées (mise à jour) : {row.validees ?? 0}</p>
                              </div>
                            );
                          }}
                        />
                        <Area
                          key={`demandes-${chartPeriod}`}
                          type="monotone"
                          dataKey="demandes"
                          name="Demandes créées"
                          stroke="#fff"
                          strokeWidth={2}
                          fill="url(#colorDemandes)"
                          fillOpacity={1}
                          animationDuration={1000}
                        />
                        <Area
                          key={`validees-${chartPeriod}`}
                          type="monotone"
                          dataKey="validees"
                          name="Validées"
                          stroke="#6366f1"
                          strokeWidth={2}
                          fill="transparent"
                          strokeDasharray="5 5"
                          animationDuration={1000}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    </div>
                  </div>
                </ChromeCard>

                <ChromeCard
                  title="Analyse"
                  subtitle="Répartition statuts et clients (comptages réels)"
                  className="flex w-full min-w-0 shrink-0 flex-col items-center justify-center md:min-h-0"
                >
                  <div className="mt-4 h-[220px] w-full min-w-0 sm:h-[240px] md:h-[250px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: "#a3a3a3", fontSize: 10, fontFamily: "Montserrat, sans-serif" }}
                        />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.[0]) return null;
                            const p = payload[0].payload as { subject: string; raw: number; A: number };
                            return (
                              <div className="rounded-lg border border-white/20 bg-black px-3 py-2 font-mono text-xs text-white shadow-xl">
                                <p className="font-bold text-white">{p.subject}</p>
                                <p className="mt-1 text-neutral-300">Nombre : {p.raw}</p>
                              </div>
                            );
                          }}
                        />
                        <Radar name="Système" dataKey="A" stroke="#a855f7" strokeWidth={2} fill="#a855f7" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </ChromeCard>
              </div>

              <ChromeCard
                className={cn(
                  "flex w-full shrink-0 flex-col overflow-hidden",
                  "max-md:flex-none max-md:min-h-0",
                  "md:flex-1 md:min-h-[min(68vh,560px)]",
                  cardShell
                )}
                title=""
                subtitle=""
                innerClassName="flex min-h-0 flex-col p-0 max-md:min-h-0 max-md:flex-none md:flex-1 md:overflow-hidden"
              >
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 bg-gradient-to-br from-indigo-950/35 via-black/50 to-transparent px-5 py-6 backdrop-blur-md sm:px-8 sm:py-7 md:px-10 md:py-8">
                  <div className="min-w-0">
                    <h2 className="flex flex-wrap items-center gap-2.5 text-lg font-black uppercase leading-snug text-white sm:gap-3 sm:text-xl md:text-2xl md:tracking-[0.15em]">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/15 sm:h-10 sm:w-10">
                        <ActivitySquare className="h-4 w-4 text-indigo-400 sm:h-5 sm:w-5" />
                      </span>
                      <span className="min-w-0 break-words">Journal des demandes</span>
                    </h2>
                    <p className="mt-2 font-mono text-xs text-neutral-400 sm:text-sm">
                      {requests.length === 1
                        ? "1 demande récente"
                        : `${requests.length} demandes récentes`}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-xs font-bold tabular-nums text-white sm:px-4 sm:py-2">
                    {requests.length}
                  </span>
                </div>
                <div className="min-h-0 flex-1 max-md:max-h-none md:overflow-auto">
                  <RequestJournal requests={requests as JournalRequest[]} />
                </div>
              </ChromeCard>
        </div>
      </div>
      </div>
    </AdminY2KLayout>
  );
}
