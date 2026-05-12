/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Filter } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { AdminY2KLayout, ChromeCard } from "@/components/admin/Y2KAdminLayout";
import { DemandRequestCard } from "@/components/admin/demandeUi";

export default function AdminDemandesPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [filters, setFilters] = useState({ status: "", clientType: "" });

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "admin") return router.push("/login");
    const token = getToken();
    const q = new URLSearchParams();
    if (filters.status) q.set("status", filters.status);
    if (filters.clientType) q.set("clientType", filters.clientType);
    apiFetch<any[]>(`/requests?${q.toString()}`, {}, token).then(setItems);
  }, [router, filters]);

  return (
    <AdminY2KLayout>
      <div className="flex-1 overflow-y-auto pb-10">
        <header className="mb-8 flex flex-col gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-violet-300/80">Pipeline P2C</p>
          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">Demandes</h1>
          <p className="max-w-2xl text-sm text-neutral-400">
            Vue synthétique des demandes clients : statut, créneau et axe de communication en un coup d&apos;œil.
          </p>
        </header>

        <ChromeCard
          title="Filtres"
          subtitle="Affinez la liste par statut ou type de client"
          className="mb-8 border-white/10"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500">
              Statut
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="rounded-xl border border-white/15 bg-black/40 py-2.5 pl-3 pr-8 text-sm text-white"
              >
                <option value="">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="validee">Validée</option>
                <option value="refusee">Refusée</option>
                <option value="a_completer">À compléter</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500">
              Type client
              <select
                value={filters.clientType}
                onChange={(e) => setFilters({ ...filters, clientType: e.target.value })}
                className="rounded-xl border border-white/15 bg-black/40 py-2.5 pl-3 pr-8 text-sm text-white"
              >
                <option value="">Tous les types</option>
                <option value="paire">Semaine paire</option>
                <option value="impaire">Semaine impaire</option>
                <option value="vip">VIP</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-neutral-500">
            <Filter className="h-3.5 w-3.5" strokeWidth={2} />
            {items.length} résultat{items.length !== 1 ? "s" : ""}
          </div>
        </ChromeCard>

        <div className="space-y-5">
          {items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] px-8 py-16 text-center">
              <p className="text-sm text-neutral-400">Aucune demande ne correspond à ces filtres.</p>
            </div>
          ) : (
            items.map((item) => <DemandRequestCard key={item._id} item={item} />)
          )}
        </div>
      </div>
    </AdminY2KLayout>
  );
}
