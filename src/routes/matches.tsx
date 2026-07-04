import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMatchFilter, MatchTypeFilterBar, type MatchTypeFilter } from "@/lib/match-filter";
import * as React from "react";

type MatchRow = {
  match_id: number;
  match_date: string;
  opponent: string;
  competition: string | null;
  city: string | null;
  estonia_sets: number;
  opponent_sets: number;
  match_type: "VM" | "AM" | "MAM";
};

async function fetchMatches(filter: MatchTypeFilter): Promise<MatchRow[]> {
  const q = supabase
    .from("matches")
    .select("match_id, match_date, opponent, competition, city, estonia_sets, opponent_sets, match_type")
    .order("match_date", { ascending: false });
  if (filter !== "ALL") q.eq("match_type", filter);
  const { data } = await q;
  return (data ?? []) as MatchRow[];
}

const matchesOptions = (filter: MatchTypeFilter) =>
  queryOptions({ queryKey: ["matches-list", filter], queryFn: () => fetchMatches(filter) });

export const Route = createFileRoute("/matches")({
  head: () => ({
    meta: [
      { title: "Matches — Estonia Men's Volleyball Archive" },
      { name: "description", content: "Complete match archive filterable by opponent, competition, year, and match type." },
    ],
  }),
  component: MatchesPage,
});

function MatchesPage() {
  const { filter } = useMatchFilter();
  const { data } = useSuspenseQuery(matchesOptions(filter));
  const [opponent, setOpponent] = React.useState("");
  const [competition, setCompetition] = React.useState("");
  const [year, setYear] = React.useState("");

  const opponents = React.useMemo(() => [...new Set(data.map((m) => m.opponent))].sort(), [data]);
  const competitions = React.useMemo(() => [...new Set(data.map((m) => m.competition).filter(Boolean))].sort() as string[], [data]);
  const years = React.useMemo(
    () => [...new Set(data.map((m) => m.match_date.slice(0, 4)))].sort().reverse(),
    [data],
  );

  const rows = data.filter((m) =>
    (opponent ? m.opponent === opponent : true) &&
    (competition ? m.competition === competition : true) &&
    (year ? m.match_date.startsWith(year) : true),
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl uppercase italic">Matches</h1>
          <p className="mt-2 text-slate-500">{rows.length.toLocaleString()} matches</p>
        </div>
        <div className="rounded-xl bg-estonia-dark p-1">
          <MatchTypeFilterBar />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Select label="Opponent" value={opponent} onChange={setOpponent} options={opponents} />
        <Select label="Competition" value={competition} onChange={setCompetition} options={competitions} />
        <Select label="Year" value={year} onChange={setYear} options={years} />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Opponent</th>
              <th className="p-3">Competition</th>
              <th className="p-3">City</th>
              <th className="p-3">Type</th>
              <th className="p-3 text-right">Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">No matches</td></tr>
            )}
            {rows.map((m) => {
              const won = m.estonia_sets > m.opponent_sets;
              return (
                <tr key={m.match_id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="p-3">{m.match_date}</td>
                  <td className="p-3 font-medium">
                    <Link to="/matches/$matchId" params={{ matchId: String(m.match_id) }} className="hover:text-estonia-blue">
                      {m.opponent}
                    </Link>
                  </td>
                  <td className="p-3 text-slate-600">{m.competition ?? "—"}</td>
                  <td className="p-3 text-slate-600">{m.city ?? "—"}</td>
                  <td className="p-3"><TypePill t={m.match_type} /></td>
                  <td className={`p-3 text-right font-bold ${won ? "text-estonia-blue" : "text-slate-500"}`}>
                    {m.estonia_sets}-{m.opponent_sets}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm">
        <option value="">All</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function TypePill({ t }: { t: "VM" | "AM" | "MAM" }) {
  const styles: Record<string, string> = {
    VM: "bg-green-100 text-green-700",
    AM: "bg-slate-100 text-slate-600",
    MAM: "bg-amber-100 text-amber-700",
  };
  return <span className={`rounded px-2 py-0.5 text-xs font-bold ${styles[t]}`}>{t}</span>;
}
