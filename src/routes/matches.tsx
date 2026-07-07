import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryErrorResetBoundary } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { allMatchesOptions, type MatchListItem } from "@/lib/matches.queries";

export const Route = createFileRoute("/matches")({
  head: () => ({
    meta: [
      { title: "Matches — Eesti Võrkpall DB" },
      {
        name: "description",
        content:
          "Complete archive of Estonia Men's National Volleyball Team matches: dates, opponents, competitions, and set scores.",
      },
      { property: "og:title", content: "Matches — Eesti Võrkpall DB" },
      {
        property: "og:description",
        content: "Every match played by the Estonia Men's National Volleyball Team.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(allMatchesOptions()),
  component: MatchesPage,
  errorComponent: MatchesError,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl uppercase italic">No matches</h1>
    </div>
  ),
});

function MatchesError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const { reset: qReset } = useQueryErrorResetBoundary();
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl uppercase italic">Data unavailable</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message || "Could not reach the database."}
      </p>
      <button
        onClick={() => {
          qReset();
          router.invalidate();
          reset();
        }}
        className="mt-6 rounded-md bg-estonia-dark px-4 py-2 text-sm font-medium text-white hover:bg-estonia-blue"
      >
        Try again
      </button>
    </div>
  );
}
const typeStyles: Record<"VM" | "AM" | "MAM", string> = {
  VM: "bg-green-100 text-green-700",
  AM: "bg-slate-100 text-slate-600",
  MAM: "bg-amber-100 text-amber-700",
};
const typeLabels: Record<"VM" | "AM" | "MAM", string> = {
  VM: "VM",
  AM: "AM",
  MAM: "MAM",
};

function getMatchType(match: MatchListItem): "VM" | "AM" | "MAM" {
  if (match.vm) return "VM";
  if (match.am) return "AM";
  return "MAM";
}

function MatchesPage() {
  const { data: matches } = useSuspenseQuery(allMatchesOptions());
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"ALL" | "VM" | "AM" | "MAM">("ALL");
  const [result, setResult] = useState<"ALL" | "W" | "L">("ALL");
  const [year, setYear] = useState("ALL");

  const years = useMemo(
    () =>
      [...new Set(matches.map((m) => m.match_date.slice(0, 4)))]
        .sort()
        .reverse(),
    [matches]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return matches.filter((m) => {
      if (type !== "ALL" && getMatchType(m) !== type) return false;
      if (result === "W" && !(m.estonia_sets > m.opponent_sets)) return false;
      if (result === "L" && !(m.estonia_sets < m.opponent_sets)) return false;
      if (year !== "ALL" && !m.match_date.startsWith(year))
        return false;
      if (!q) return true;
      return (
        m.opponent.toLowerCase().includes(q) ||
        (m.competition ?? "").toLowerCase().includes(q) ||
        (m.city ?? "").toLowerCase().includes(q)
      );
    });
  }, [matches, search, type, result, year]);

  const vmMatches = matches.filter((m) => m.vm);
  const vmWins = vmMatches.filter(
    (m) => m.estonia_sets > m.opponent_sets
  ).length;
  const vmLosses = vmMatches.length - vmWins;

  const amMatches = matches.filter((m) => m.am);
  const amWins = amMatches.filter(
    (m) => m.estonia_sets > m.opponent_sets
  ).length;
  const amLosses = amMatches.length - amWins;

  const allMatches = matches.filter(
    (m) => m.am || m.mam
  );
  const allWins = allMatches.filter(
    (m) => m.estonia_sets > m.opponent_sets
  ).length;
  const allLosses = allMatches.length - allWins;

  return (
    <div className="text-slate-900">
      <header className="bg-estonia-dark px-6 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <h1 className="mt-2 font-display text-4xl uppercase italic md:text-5xl">Matches</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Every recorded match of the Estonia Men's National Volleyball Team.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <StatGroup
              title="Competitive Matches"
              total={vmMatches.length}
              wins={vmWins}
              losses={vmLosses}
            />

            <StatGroup
              title="Official Matches"
              total={amMatches.length}
              wins={amWins}
              losses={amLosses}
            />

            <StatGroup
              title="All Matches"
              total={allMatches.length}
              wins={allWins}
              losses={allLosses}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search opponent, competition, city…"
            className="w-full max-w-sm rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-estonia-blue"
          />

          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm"
          >
            <option value="ALL">Year</option>

            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <Segmented
            value={type}
            onChange={(v) => setType(v as typeof type)}
            options={[
              { value: "ALL", label: "All" },
              { value: "VM", label: "VM" },
              { value: "AM", label: "AM" },
              { value: "MAM", label: "MAM" },
            ]}
          />
          <Segmented
            value={result}
            onChange={(v) => setResult(v as typeof result)}
            options={[
              { value: "ALL", label: "All results" },
              { value: "W", label: "Wins" },
              { value: "L", label: "Losses" },
            ]}
          />

          <div className="ml-auto text-xs uppercase tracking-widest text-slate-400">
            {filtered.length} match{filtered.length === 1 ? "" : "es"}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-12 gap-3 border-b border-slate-100 bg-slate-50 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 md:grid">
            <div className="col-span-2">Date</div>
            <div className="col-span-3">Opponent</div>
            <div className="col-span-1 text-center">Score</div>
            <div className="col-span-3">Competition</div>
            <div className="col-span-2">City</div>
            <div className="col-span-1 text-right">Type</div>
          </div>
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-display text-xl uppercase italic text-slate-400">No results</p>
              <p className="mt-2 text-sm text-slate-500">Adjust filters or clear the search.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((m) => (
                <MatchRow key={m.match_id} match={m} />
              ))}
            </ul>
          )}
        </div>
      </main>
    </div >
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-l-2 border-estonia-blue pl-4 text-center">
      <div className="font-display text-3xl">{value.toLocaleString("en-US")}</div>
      <div className="mt-1 text-[10px] uppercase tracking-widest opacity-60">{label}</div>
    </div>
  );
}

function StatGroup({
  title,
  total,
  wins,
  losses,
}: {
  title: string;
  total: number;
  wins: number;
  losses: number;
}) {
  return (
    <div className="rounded-lg border border-white/20 bg-white/5 p-4">
      <div className="mb-4 border-b border-white/10 pb-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white">
        {title}
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <Kpi label="Total" value={total} />
        <Kpi label="Wins" value={wins} />
        <Kpi label="Losses" value={losses} />
      </div>
    </div>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-slate-200 bg-white text-xs font-semibold uppercase tracking-wide">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={
              active
                ? "bg-estonia-dark px-3 py-2 text-white"
                : "px-3 py-2 text-slate-500 hover:bg-slate-50"
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function MatchRow({ match }: { match: MatchListItem }) {
  const won = match.estonia_sets > match.opponent_sets;
  return (
    <li className="grid grid-cols-1 gap-2 px-6 py-4 transition-colors hover:bg-slate-50 md:grid-cols-12 md:items-center md:gap-3">
      <div className="col-span-2 text-sm text-slate-500">
        {new Date(match.match_date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </div>
      <div className="col-span-3 flex items-center gap-2 text-sm font-semibold uppercase">
        <span className="text-slate-900">Estonia</span>
        <span className="text-slate-300">vs</span>
        <span className="text-slate-900">{match.opponent}</span>
      </div>
      <div className="col-span-1 text-center">
        <span
          className={`inline-block rounded px-2 py-0.5 font-display text-base ${won ? "bg-estonia-blue/10 text-estonia-blue" : "bg-slate-100 text-red-700"
            }`}
        >
          {match.estonia_sets}–{match.opponent_sets}
        </span>
      </div>
      <div className="col-span-3 truncate text-sm text-slate-600">
        {match.competition ?? "—"}
      </div>
      <div className="col-span-2 truncate text-sm text-slate-500">{match.city ?? "—"}</div>
      <div className="col-span-1 flex justify-start md:justify-end">
        <span
          className={`rounded px-2 py-0.5 text-[10px] font-bold ${typeStyles[getMatchType(match)]}`}
        >
          {typeLabels[getMatchType(match)]}
        </span>
      </div>

      {match.notes && (
        <div className="col-span-12 border-l-2 border-estonia-blue pl-3 text-sm italic text-slate-500">
          {match.notes}
        </div>
      )}
    </li>
  );
}