/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getToken, getUser } from "@/lib/auth";
import { MemberCinematicHero } from "@/components/member/MemberBrandImagery";
import { MemberY2KLayout } from "@/components/member/MemberY2KLayout";
import { P2cRequestForm, requestToFormState } from "@/components/member/P2cRequestForm";

const EDITABLE = new Set(["en_attente", "a_completer"]);

export default function ModifierDemandePage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || "");
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [initialForm, setInitialForm] = useState<ReturnType<typeof requestToFormState> | null>(null);
  const [p2cSlot, setP2cSlot] = useState<1 | 2>(1);

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "client") {
      router.push("/login");
      return;
    }
    const token = getToken();
    apiFetch<any>(`/requests/${id}`, {}, token)
      .then((r) => {
        if (!EDITABLE.has(r.status)) {
          setForbidden(true);
          return;
        }
        setP2cSlot(r.p2cSlot === 2 ? 2 : 1);
        setInitialForm(requestToFormState(r));
      })
      .catch(() => setForbidden(true))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <MemberY2KLayout>
        <p className="font-mono text-sm text-neutral-500">Chargement…</p>
      </MemberY2KLayout>
    );
  }

  if (forbidden || !initialForm) {
    return (
      <MemberY2KLayout>
        <p className="text-sm text-amber-200">Cette demande ne peut pas être modifiée.</p>
        <Link href="/membre/demandes" className="mt-4 inline-block text-violet-300 hover:underline">
          ← Retour à mes demandes
        </Link>
      </MemberY2KLayout>
    );
  }

  return (
    <MemberY2KLayout>
      <p className="mb-4 text-sm text-neutral-400">
        <Link href="/membre/demandes" className="text-violet-300 underline-offset-4 hover:text-white hover:underline">
          ← Mes demandes
        </Link>
      </p>
      <MemberCinematicHero
        className="mb-8"
        eyebrow="Modification"
        title="Mettre à jour ma demande"
        description="Ajustez vos coordonnées, votre projet ou votre créneau — Pixaura traite votre dossier dès validation."
      />
      <P2cRequestForm
        requestId={id}
        p2cSlot={p2cSlot}
        initialForm={initialForm}
        title={`Modifier le Projet ${p2cSlot}`}
        subtitle="Tous les champs sont modifiables. Le calendrier n’affiche que les dates réellement disponibles."
        onSuccess={() => router.push("/membre/demandes")}
      />
    </MemberY2KLayout>
  );
}
