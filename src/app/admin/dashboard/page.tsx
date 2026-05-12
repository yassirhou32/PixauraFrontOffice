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

  return (
    <AdminY2KLayout>
      <div className="flex h-full min-h-0 flex-col">
      <header className="mb-4 shrink-0 sm:mb-6 md:mb-8">
        <div className="min-w-0">
          <h1 className="mb-1 text-3xl font-black leading-tight tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 sm:mb-2 sm:text-4xl md:text-5xl lg:text-6xl">
            PIXAURA
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-widest text-neutral-400 sm:text-xs">
            <div className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-green-400 shadow-[0_0_10px_#4ade80]" />
            <span className="min-w-0">Backoffice connecte</span>
            <span className="text-neutral-600">|</span>
            <span>v.1.0.0</span>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl pb-8 pr-1 scrollbar-none sm:rounded-[32px] sm:pr-2 sm:pb-10">
        <div className="flex flex-col gap-10 pb-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <ChromeCard className="md:col-span-2 bg-gradient-to-r from-indigo-900/30 to-purple-900/30" title="Demandes totales" subtitle="Vue operationnelle">
                  <div className="flex justify-between items-start h-full relative z-10">
                    <div className="flex flex-col justify-between h-full">
                      <div className="flex items-center gap-2 border border-white/20 rounded-full w-fit px-3 py-1 bg-white/5 backdrop-blur-md">
                        <Zap className="w-4 h-4 text-yellow-300" />
                        <span className="text-xs font-bold uppercase">Total demandes</span>
                      </div>
                      <div>
                        <h2 className="text-4xl font-black tracking-tighter text-glow sm:text-5xl md:text-6xl">{stats?.total ?? 0}</h2>
                        <p className="font-mono text-neutral-400 mt-2">P2C enregistres</p>
                      </div>
                    </div>
                    <div className="h-full flex items-end gap-1">
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [20, 60, 20] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                          className="w-4 bg-white/20 rounded-t-full"
                        />
                      ))}
                    </div>
                  </div>
                </ChromeCard>

                {[
                  { label: "Clients actifs", val: String(stats?.clientsActifs ?? 0), trend: "en ligne" },
                  { label: "En attente", val: String(stats?.en_attente ?? 0), trend: "a traiter" },
                ].map((stat, i) => (
                  <ChromeCard key={i} className="flex flex-col h-full justify-between" title={stat.label} subtitle={stat.trend}>
                    <div className="flex flex-col h-full justify-between">
                      <p className="font-mono text-xs uppercase text-neutral-400">{stat.label}</p>
                      <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-bold sm:text-4xl">{stat.val}</h3>
                        <div className="bg-white/10 px-2 py-1 rounded text-xs font-mono">{stat.trend}</div>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: "70%" }} transition={{ delay: 0.5 }} className="h-full bg-white shadow-[0_0_10px_white]" />
                      </div>
                    </div>
                  </ChromeCard>
                ))}

                <ChromeCard className="md:col-span-2 lg:col-span-3 min-h-[400px]" title="System Telemetry" subtitle="Demandes créées vs validations (données réelles)">
                  <div className="absolute top-6 right-6 flex gap-2">
                    {(
                      [
                        { id: "daily" as const, label: "Jour" },
                        { id: "monthly" as const, label: "Mois" },
                        { id: "yearly" as const, label: "Année" },
                      ] as const
                    ).map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setChartPeriod(id)}
                        className={cn(
                          "px-3 py-1 text-[10px] font-mono border border-white/20 rounded uppercase transition-colors tracking-wider",
                          chartPeriod === id ? "bg-white text-black font-bold" : "hover:bg-white/10 hover:text-white"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorDemandes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#fff" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#fff" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis dataKey="name" stroke="#525252" tick={{ fontFamily: "Montserrat, sans-serif", fontSize: 12, fill: "#737373" }} tickLine={false} axisLine={false} dy={10} />
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
                          name="Demandes creees"
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
                          name="Validees"
                          stroke="#6366f1"
                          strokeWidth={2}
                          fill="transparent"
                          strokeDasharray="5 5"
                          animationDuration={1000}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </ChromeCard>

                <ChromeCard title="Analysis" subtitle="Répartition statuts et clients (comptages réels)" className="flex flex-col items-center justify-center">
                  <div className="h-[250px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#a3a3a3", fontSize: 10, fontFamily: "Montserrat, sans-serif" }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.[0]) return null;
                            const p = payload[0].payload as { subject: string; raw: number; A: number };
                            return (
                              <div
                                className="rounded-lg border border-white/20 bg-black px-3 py-2 font-mono text-xs text-white shadow-xl"
                              >
                                <p className="font-bold text-white">{p.subject}</p>
                                <p className="mt-1 text-neutral-300">Nombre : {p.raw}</p>
                              </div>
                            );
                          }}
                        />
                        <Radar name="System" dataKey="A" stroke="#a855f7" strokeWidth={2} fill="#a855f7" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </ChromeCard>
              </div>

              <ChromeCard
                className="flex min-h-[min(70vh,520px)] w-full flex-1 flex-col overflow-hidden sm:min-h-[600px]"
                title=""
                subtitle=""
                innerClassName="flex min-h-0 flex-1 flex-col p-0"
              >
                <div className="flex shrink-0 flex-col gap-1 border-b border-white/10 bg-black/40 px-4 py-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="min-w-0 pr-2">
                    <h2 className="flex flex-wrap items-center gap-2 text-lg font-black uppercase leading-snug tracking-normal text-white sm:gap-3 sm:text-xl sm:tracking-wide md:text-2xl md:tracking-widest">
                      <ActivitySquare className="h-5 w-5 shrink-0 text-indigo-500 sm:h-6 sm:w-6" />
                      <span className="min-w-0 break-words">Demandes logs</span>
                    </h2>
                    <p className="mt-1 font-mono text-[10px] text-neutral-400 sm:text-xs">{requests.length} paquets interceptes</p>
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-auto">
                  <table className="w-full min-w-[32rem] table-fixed text-left font-mono text-[11px] sm:min-w-0 sm:table-auto sm:text-xs">
                    <thead className="sticky top-0 z-10 border-b border-white/10 bg-neutral-900/95 backdrop-blur-md">
                      <tr>
                        <th className="w-[28%] py-3 pl-4 pr-2 font-bold uppercase tracking-wide text-neutral-500 sm:w-auto sm:px-6 sm:tracking-widest">
                          Client
                        </th>
                        <th className="w-[18%] py-3 px-2 font-bold uppercase tracking-wide text-neutral-500 sm:px-6 sm:tracking-widest">
                          Type
                        </th>
                        <th className="w-[20%] py-3 px-2 font-bold uppercase tracking-wide text-neutral-500 sm:px-6 sm:tracking-widest">
                          Date
                        </th>
                        <th className="hidden py-3 px-2 font-bold uppercase tracking-wide text-neutral-500 sm:table-cell sm:px-6 sm:tracking-widest">
                          Axe
                        </th>
                        <th className="w-[22%] py-3 pl-2 pr-4 text-right font-bold uppercase tracking-wide text-neutral-500 sm:w-auto sm:px-6 sm:tracking-widest">
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {requests.map((log) => (
                        <tr key={log._id} className="cursor-crosshair transition-colors hover:bg-white/5">
                          <td className="max-w-0 truncate py-3 pl-4 pr-2 font-bold text-indigo-400 sm:max-w-none sm:px-6 sm:whitespace-normal">
                            {log.client?.companyName || "-"}
                          </td>
                          <td className="truncate py-3 px-2 text-neutral-300 sm:px-6 sm:whitespace-normal">{log.client?.clientType || "-"}</td>
                          <td className="whitespace-nowrap py-3 px-2 text-neutral-500 sm:px-6">{new Date(log.requestedDate).toLocaleDateString()}</td>
                          <td className="hidden py-3 px-2 text-neutral-300 sm:table-cell sm:px-6">{log.communicationAxis}</td>
                          <td className="py-3 pl-2 pr-4 text-right sm:px-6">
                            <span
                              className={cn(
                                "inline-block max-w-full truncate rounded border px-1.5 py-0.5 text-[10px] sm:px-2 sm:text-xs",
                                log.status === "validee"
                                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                                  : log.status === "en_attente"
                                    ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                                    : "border-red-500/30 bg-red-500/10 text-red-500"
                              )}
                            >
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ChromeCard>
        </div>
      </div>
      </div>
    </AdminY2KLayout>
  );
}
