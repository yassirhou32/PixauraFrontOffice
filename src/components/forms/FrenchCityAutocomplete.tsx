"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  type FrenchCommune,
  formatCommuneLine,
  searchFrenchCommunes,
} from "@/lib/frenchCommunes";

type FrenchCityAutocompleteProps = {
  value: string;
  postalCode?: string;
  cityName?: string;
  onChange: (cityLine: string, commune: FrenchCommune | null, postalCode: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  inputClassName?: string;
};

export function FrenchCityAutocomplete({
  value,
  postalCode: postalCodeProp,
  cityName,
  onChange,
  disabled = false,
  required = false,
  className = "",
  inputClassName = "",
}: FrenchCityAutocompleteProps) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<FrenchCommune[]>([]);
  const [selected, setSelected] = useState<FrenchCommune | null>(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    if (!cityName || !postalCodeProp) {
      setSelected(null);
      return;
    }
    setSelected({
      nom: cityName,
      code: "",
      codesPostaux: [postalCodeProp],
    });
  }, [cityName, postalCodeProp]);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      const list = await searchFrenchCommunes(q);
      setOptions(list);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || disabled) return;
    const t = window.setTimeout(() => void runSearch(query), 280);
    return () => window.clearTimeout(t);
  }, [query, open, disabled, runSearch]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(commune: FrenchCommune, cp?: string) {
    const postal = cp || commune.codesPostaux[0] || "";
    const line = formatCommuneLine(commune, postal);
    setSelected(commune);
    setQuery(line);
    setOpen(false);
    onChange(line, commune, postal);
  }

  function onInputChange(next: string) {
    setQuery(next);
    setSelected(null);
    onChange(next, null, "");
    setOpen(true);
  }

  const defaultInputClass =
    "box-border h-11 w-full min-w-0 rounded-lg border border-white/12 bg-black/45 px-3 text-[15px] text-white outline-none placeholder:text-neutral-600 focus:border-violet-400/40";

  return (
    <div ref={wrapRef} className={`relative min-w-0 ${className}`}>
      <label htmlFor={listId} className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">
        Ville (code postal) <span className="text-violet-300">*</span>
      </label>
      <input
        id={listId}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        disabled={disabled}
        required={required}
        value={query}
        placeholder="Ex. Trambly, 71520, Paris…"
        className={inputClassName || defaultInputClass}
        onFocus={() => !disabled && setOpen(true)}
        onChange={(e) => onInputChange(e.target.value)}
      />
      {open && !disabled ? (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-white/15 bg-zinc-950 py-1 shadow-xl"
        >
          {loading ? (
            <li className="px-3 py-2 text-xs text-neutral-500">Recherche…</li>
          ) : options.length === 0 ? (
            <li className="px-3 py-2 text-xs text-neutral-500">
              {query.trim().length < 2 ? "Saisissez au moins 2 caractères" : "Aucune commune trouvée"}
            </li>
          ) : (
            options.map((c) =>
              (c.codesPostaux.length ? c.codesPostaux : [""]).map((cp) => (
                <li key={`${c.code}-${cp}`} role="option">
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-white hover:bg-violet-500/20"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(c, cp || undefined)}
                  >
                    <span className="font-mono text-violet-200">{cp || "—"}</span>{" "}
                    <span className="font-semibold">{c.nom}</span>
                  </button>
                </li>
              ))
            )
          )}
        </ul>
      ) : null}
      {!disabled && !selected && query.trim().length > 0 ? (
        <p className="mt-1 text-[10px] text-amber-200/90">Choisissez une ville dans la liste proposée.</p>
      ) : null}
    </div>
  );
}
