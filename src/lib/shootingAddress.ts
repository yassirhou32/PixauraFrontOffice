import type { FrenchCommune } from "@/lib/frenchCommunes";
import { formatCommuneLine } from "@/lib/frenchCommunes";

/** Décompose une adresse enregistrée (rue optionnelle + CP ville). */
export function parseShootingAddress(value: string): {
  streetLine: string;
  cityLine: string;
  postalCode: string;
  cityName: string;
} {
  const raw = (value || "").trim();
  if (!raw) {
    return { streetLine: "", cityLine: "", postalCode: "", cityName: "" };
  }

  const withStreet = raw.match(/^(.*),\s*(\d{5})\s+(.+)$/);
  if (withStreet) {
    return {
      streetLine: withStreet[1].trim(),
      cityLine: `${withStreet[2]} ${withStreet[3].trim()}`,
      postalCode: withStreet[2],
      cityName: withStreet[3].trim(),
    };
  }

  const cityOnly = raw.match(/^(\d{5})\s+(.+)$/);
  if (cityOnly) {
    return {
      streetLine: "",
      cityLine: `${cityOnly[1]} ${cityOnly[2].trim()}`,
      postalCode: cityOnly[1],
      cityName: cityOnly[2].trim(),
    };
  }

  return { streetLine: raw, cityLine: "", postalCode: "", cityName: "" };
}

export function buildShootingAddress(streetLine: string, commune: FrenchCommune, postalCode?: string): string {
  const cityPart = formatCommuneLine(commune, postalCode);
  const street = streetLine.trim();
  return street ? `${street}, ${cityPart}` : cityPart;
}
