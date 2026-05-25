"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { getToken, getUser } from "@/lib/auth";
import { MemberY2KLayout } from "@/components/member/MemberY2KLayout";
import { ChromeCard } from "@/components/admin/Y2KAdminLayout";
import { MemberP2cPageHeader } from "@/components/member/MemberBrandImagery";
import { P2cRequestForm, type P2cFormState } from "@/components/member/P2cRequestForm";
import { fetchP2cPageStatus, type P2cMonthStatus } from "@/lib/p2cStatus";
import { FULL_DAY_SLOT_ID } from "@/lib/calendarClient";

/** Projet 2 verrouillé : uniquement les données du Projet 2. */
function buildLockedP2Display(p2: Partial<P2cFormState> | null | undefined): Partial<P2cFormState> | undefined {
  if (!p2) return undefined;
  const hasP2Data = Boolean(p2.requestedDate || p2.timeSlotId || p2.company?.trim());
  if (!hasP2Data) return undefined;
  return {
    ...p2,
    requestedDate: p2.requestedDate || "",
    timeSlotId: p2.timeSlotId || "",
  };
}

export default function MembreP2CPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<P2cMonthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  /** Déblocage immédiat du P2 entre l’envoi du P1 et la fin du rechargement */
  const [p1JustSent, setP1JustSent] = useState(false);
  const [p1Snapshot, setP1Snapshot] = useState<Partial<P2cFormState> | null>(null);

  const loadPage = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchP2cPageStatus(token);
      setStatus(data);
      setP1JustSent(false);
    } catch {
      setLoadError("Impossible de charger vos projets P2C. Réessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "client") {
      router.push("/login");
      return;
    }
    void loadPage();
  }, [router, pathname, loadPage]);

  /** P1 verrouillé dès qu’une demande Projet 1 existe (sauf page modifier dédiée) */
  const p1Locked = p1JustSent || Boolean(status && !status.canOpenProject1);

  const lockedP1Form = useMemo((): Partial<P2cFormState> | undefined => {
    const fromApi = status?.lockedProject1 as Partial<P2cFormState> | null | undefined;
    if (fromApi && Object.keys(fromApi).length > 0) return fromApi;
    return p1Snapshot || undefined;
  }, [status?.lockedProject1, p1Snapshot]);

  const lockedP2Form = useMemo((): Partial<P2cFormState> | undefined => {
    const p2 = status?.lockedProject2 as Partial<P2cFormState> | null | undefined;
    return buildLockedP2Display(p2);
  }, [status?.lockedProject2]);

  const p2BlockedByFullDay = Boolean(
    status?.project1.isFullDay ||
      status?.p2c.monthFullyBlocked ||
      p1Snapshot?.timeSlotId === FULL_DAY_SLOT_ID
  );
  const p2Done = Boolean(status?.project2.submitted);
  const p2CanFill =
    (Boolean(status?.canOpenProject2) || (p1JustSent && !p2Done)) && !p2BlockedByFullDay && !p2Done;

  const handleP1Success = (form: P2cFormState) => {
    setP1Snapshot(form);
    setP1JustSent(true);
    void loadPage();
  };

  const monthHint =
    status?.month && status?.year
      ? `Mois des tournages : ${String(status.month).padStart(2, "0")}/${status.year}`
      : null;

  return (
    <MemberY2KLayout wideMain>
      <MemberP2cPageHeader
        eyebrow="Espace membre · P2C"
        title="Vos tournages Pixaura"
        description="Deux projets par mois — créneaux de 2 h ou journée complète. Renseignez vos coordonnées et réservez votre date en toute clarté."
      />
      <p className="mb-6 text-sm text-neutral-400">
        <Link href="/membre/demandes" className="text-violet-300 underline-offset-4 hover:text-white hover:underline">
          Voir le suivi de mes demandes
        </Link>
        {" · "}
        Projet 1 à gauche (verrouillé après envoi). Projet 2 à droite après validation du Projet 1.
      </p>

      {loading ? (
        <p className="text-sm text-neutral-500">Chargement de vos projets…</p>
      ) : loadError ? (
        <ChromeCard title="P2C" subtitle="Erreur">
          <p className="text-sm text-red-200/90">{loadError}</p>
          <button
            type="button"
            onClick={() => void loadPage()}
            className="mt-3 rounded-lg border border-violet-400/40 px-4 py-2 text-xs font-bold uppercase tracking-wide text-violet-200"
          >
            Réessayer
          </button>
        </ChromeCard>
      ) : !status ? (
        <p className="text-sm text-neutral-500">Aucune donnée P2C.</p>
      ) : (
        <ChromeCard
          title="Vos deux projets P2C"
          subtitle={monthHint || "Deux formulaires côte à côte pour le mois en cours."}
          className="!overflow-visible w-full"
          innerClassName="p-3 sm:p-5 lg:p-6"
        >
          <motion.div className="grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-8 xl:gap-10">
            <motion.div id="projet-1" className="min-w-0 scroll-mt-6">
              {p1Locked ? (
                <>
                  <P2cRequestForm
                    p2cSlot={1}
                    wideColumn
                    frozen
                    sentLocked
                    initialForm={lockedP1Form}
                    title="Projet 1"
                    subtitle="Demande envoyée — formulaire verrouillé."
                  />
                  {status.project1.editable && status.project1.requestId ? (
                    <Link
                      href={`/membre/demandes/${status.project1.requestId}/modifier`}
                      className="mt-2 inline-block text-xs text-violet-300 underline"
                    >
                      Modifier le Projet 1
                    </Link>
                  ) : null}
                </>
              ) : (
                <P2cRequestForm
                  p2cSlot={1}
                  wideColumn
                  title="Projet 1"
                  subtitle="Premier projet du mois — créneau 2 h ou journée complète."
                  submitLabel="Envoyer le Projet 1"
                  onSuccess={handleP1Success}
                />
              )}
            </motion.div>

            <motion.div id="projet-2" className="relative min-w-0 scroll-mt-6">
              {p2Done ? (
                <>
                  <P2cRequestForm
                    key={`p2-locked-${status.project2.requestId || "done"}`}
                    p2cSlot={2}
                    wideColumn
                    frozen
                    sentLocked
                    initialForm={lockedP2Form}
                    title="Projet 2"
                    subtitle="Demande envoyée — formulaire verrouillé."
                  />
                  {status.project2.editable && status.project2.requestId ? (
                    <Link
                      href={`/membre/demandes/${status.project2.requestId}/modifier`}
                      className="mt-2 inline-block text-xs text-violet-300 underline"
                    >
                      Modifier le Projet 2
                    </Link>
                  ) : null}
                </>
              ) : p2BlockedByFullDay && p1Locked ? (
                <ChromeCard title="Projet 2" subtitle="Indisponible" className="h-full !border-white/5">
                  <p className="text-sm text-neutral-300">
                    Journée complète au Projet 1 : aucun second formulaire ce mois-ci.
                  </p>
                </ChromeCard>
              ) : p2CanFill ? (
                <P2cRequestForm
                  key={`p2-${status.project1.requestId || "ready"}`}
                  p2cSlot={2}
                  wideColumn
                  title="Projet 2"
                  subtitle="Deuxième projet du mois — tous les champs à remplir (axe, adresse, date, créneau…)."
                  submitLabel="Envoyer le Projet 2"
                  onSuccess={() => void loadPage()}
                />
              ) : (
                <P2cRequestForm
                  p2cSlot={2}
                  wideColumn
                  frozen
                  title="Projet 2"
                  subtitle="S’active après l’envoi du Projet 1."
                  submitLabel="Envoyer le Projet 2"
                />
              )}
            </motion.div>
          </motion.div>
        </ChromeCard>
      )}
    </MemberY2KLayout>
  );
}
