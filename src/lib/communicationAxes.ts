export type CommunicationAxisId = "commercial" | "humain" | "expertise" | "autre";

export type CommunicationAxisOption = {
  id: CommunicationAxisId;
  label: string;
  description: string;
};

export const COMMUNICATION_AXES: CommunicationAxisOption[] = [
  {
    id: "commercial",
    label: "Commercial",
    description: "Offre, promotion, vente — message orienté produit ou service.",
  },
  {
    id: "humain",
    label: "Humain",
    description: "Équipe, coulisses, témoignages — mise en avant des personnes.",
  },
  {
    id: "expertise",
    label: "Expertise",
    description: "Savoir-faire, méthode, preuve de compétence — crédibilité métier.",
  },
  {
    id: "autre",
    label: "Autre",
    description: "Axe spécifique — précisez dans le détail du projet.",
  },
];

const LABELS: Record<string, string> = Object.fromEntries(
  COMMUNICATION_AXES.map((a) => [a.id, a.label])
);

export function axisLabelFr(axis: string | undefined): string {
  return LABELS[axis || ""] || axis || "—";
}

export function isValidCommunicationAxis(axis: string): axis is CommunicationAxisId {
  return COMMUNICATION_AXES.some((a) => a.id === axis);
}
