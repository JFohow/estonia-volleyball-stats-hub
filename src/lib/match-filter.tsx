import * as React from "react";

export type MatchTypeFilter = "ALL" | "VM" | "AM" | "MAM";

const STORAGE_KEY = "evdb.matchTypeFilter";

type Ctx = {
  filter: MatchTypeFilter;
  setFilter: (f: MatchTypeFilter) => void;
};

const MatchFilterContext = React.createContext<Ctx | null>(null);

export function MatchFilterProvider({ children }: { children: React.ReactNode }) {
  const [filter, setFilterState] = React.useState<MatchTypeFilter>("ALL");

  React.useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "VM" || v === "AM" || v === "MAM" || v === "ALL") setFilterState(v);
    } catch {}
  }, []);

  const setFilter = React.useCallback((f: MatchTypeFilter) => {
    setFilterState(f);
    try {
      localStorage.setItem(STORAGE_KEY, f);
    } catch {}
  }, []);

  return (
    <MatchFilterContext.Provider value={{ filter, setFilter }}>
      {children}
    </MatchFilterContext.Provider>
  );
}

export function useMatchFilter(): Ctx {
  const ctx = React.useContext(MatchFilterContext);
  if (!ctx) return { filter: "ALL", setFilter: () => {} };
  return ctx;
}

export const MATCH_TYPE_LABELS: Record<Exclude<MatchTypeFilter, "ALL">, string> = {
  VM: "Competitive",
  AM: "Official",
  MAM: "Non-official",
};

export function MatchTypeFilterBar({ className = "" }: { className?: string }) {
  const { filter, setFilter } = useMatchFilter();
  const options: { value: MatchTypeFilter; label: string; hint?: string }[] = [
    { value: "ALL", label: "All" },
    { value: "VM", label: "Competitive", hint: "VM" },
    { value: "AM", label: "Official", hint: "AM" },
    { value: "MAM", label: "Non-official", hint: "MAM" },
  ];

  return (
    <div className={`inline-flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 ${className}`}>
      {options.map((o) => {
        const active = filter === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setFilter(o.value)}
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
              active
                ? "bg-estonia-blue text-white shadow"
                : "text-white/70 hover:text-white"
            }`}
            title={o.hint ? `${o.label} (${o.hint})` : o.label}
          >
            {o.label}
            {o.hint && <span className="ml-1 opacity-60">{o.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}
