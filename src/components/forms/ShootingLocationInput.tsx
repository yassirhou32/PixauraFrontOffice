"use client";

import { useEffect, useState } from "react";
import type { FrenchCommune } from "@/lib/frenchCommunes";
import { buildShootingAddress, parseShootingAddress } from "@/lib/shootingAddress";
import { FrenchCityAutocomplete } from "@/components/forms/FrenchCityAutocomplete";

type ShootingLocationInputProps = {
  value: string;
  onChange: (fullAddress: string) => void;
  disabled?: boolean;
  required?: boolean;
  lockedInputClass?: string;
  editableInputClass?: string;
  className?: string;
};

export function ShootingLocationInput({
  value,
  onChange,
  disabled = false,
  required = false,
  lockedInputClass,
  editableInputClass,
  className = "md:col-span-2",
}: ShootingLocationInputProps) {
  const parsed = parseShootingAddress(value);
  const [streetLine, setStreetLine] = useState(parsed.streetLine);
  const [cityLine, setCityLine] = useState(parsed.cityLine);
  const [postalCode, setPostalCode] = useState(parsed.postalCode);
  const [cityName, setCityName] = useState(parsed.cityName);
  const [commune, setCommune] = useState<FrenchCommune | null>(null);

  useEffect(() => {
    const p = parseShootingAddress(value);
    setStreetLine(p.streetLine);
    setCityLine(p.cityLine);
    setPostalCode(p.postalCode);
    setCityName(p.cityName);
  }, [value]);

  const streetClass =
    lockedInputClass ||
    editableInputClass ||
    "box-border h-11 w-full min-w-0 rounded-lg border border-white/12 bg-black/45 px-3 text-[15px] text-white outline-none placeholder:text-neutral-600 focus:border-violet-400/40";

  function emit(nextStreet: string, nextCommune: FrenchCommune | null, nextCp: string) {
    if (nextCommune && nextCp) {
      onChange(buildShootingAddress(nextStreet, nextCommune, nextCp));
      return;
    }
    onChange("");
  }

  function onCityChange(line: string, c: FrenchCommune | null, cp: string) {
    setCityLine(line);
    setCommune(c);
    setPostalCode(cp);
    setCityName(c?.nom || "");
    if (c && cp) emit(streetLine, c, cp);
    else onChange("");
  }

  function onStreetChange(next: string) {
    setStreetLine(next);
    if (commune && postalCode) emit(next, commune, postalCode);
  }

  if (disabled) {
    return (
      <div className={className}>
        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">
          Adresse de tournage
        </label>
        <input readOnly value={value} className={lockedInputClass || streetClass} />
      </div>
    );
  }

  return (
    <div className={`grid min-w-0 grid-cols-1 gap-3 ${className}`}>
      <FrenchCityAutocomplete
        value={cityLine}
        postalCode={postalCode}
        cityName={cityName}
        required={required}
        onChange={onCityChange}
        inputClassName={editableInputClass || streetClass}
      />
      <div>
        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">
          Rue / complément (optionnel)
        </label>
        <input
          type="text"
          value={streetLine}
          placeholder="Ex. 12 rue de la République"
          className={editableInputClass || streetClass}
          onChange={(e) => onStreetChange(e.target.value)}
        />
      </div>
    </div>
  );
}

/** Ville choisie dans la liste (CP + nom). */
export function isShootingCityValid(value: string): boolean {
  const p = parseShootingAddress(value);
  return /^\d{5}$/.test(p.postalCode) && p.cityName.length > 0;
}
