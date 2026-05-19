export type FrenchCommune = {
  nom: string;
  code: string;
  codesPostaux: string[];
};

export function formatCommuneLine(c: FrenchCommune, postalCode?: string): string {
  const cp = postalCode || c.codesPostaux[0] || "";
  return cp ? `${cp} ${c.nom}` : c.nom;
}

/** Recherche communes françaises (API publique geo.api.gouv.fr). */
export async function searchFrenchCommunes(query: string): Promise<FrenchCommune[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const isPostal = /^\d{2,5}$/.test(q);
  const url = isPostal
    ? `https://geo.api.gouv.fr/communes?codePostal=${encodeURIComponent(q)}&fields=nom,code,codesPostaux&limit=15`
    : `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&boost=population&fields=nom,code,codesPostaux&limit=15`;

  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as FrenchCommune[];
  return Array.isArray(data) ? data : [];
}
