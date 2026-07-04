import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMatchFilter, MatchTypeFilterBar, type MatchTypeFilter } from "@/lib/match-filter";
import * as React from "react";

type OppRow = {
  opponent: string;
  matches: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  winPct: number;
  lastMatch: string | null;
};

async function fetchOpponents(filter: MatchTypeFilter): Promise<OppRow[]> {
  const q = supabase.from("matches").select("opponent, estonia_sets, opponent_sets, match_date, match_type");
  if (filter !== "ALL") q.eq("match_type", filter);
  const { data: matches } = await q;

  const map = new Map<string, OppRow>();
  for (const m of matches ?? []) {
    if (!m.opponent) continue;
    const cur = map.get(m.opponent) ?? {
      opponent: m.opponent, matches: 0, wins: 0, losses: 0, setsWon: 0, setsLost: 0, winPct: 0, lastMatch: null,
    };
    cur.matches += 1;
    cur.setsWon += m.estonia_sets ?? 0;
    cur.setsLost += m.opponent_sets ?? 0;
    if ((m.estonia_sets ?? 0) > (m.opponent_sets ?? 0)) cur.wins += 1;
    else if ((m.estonia_sets ?? 0) < (m.opponent_sets ?? 0)) cur.losses += 1;
    if (!cur.lastMatch || m.match_date > cur.lastMatch) cur.lastMatch = m.match_date;
    map.set(m.opponent, cur);
  }
  return [...map.values()].map((o) => ({ ...o, winPct: o.matches ? Math.round((o.wins / o.matches) * 100) : 0 }));
}

const opponentsOptions = (filter: MatchTypeFilter) =>
  queryOptions({ queryKey: ["opponents-list", filter], queryFn: () => fetchOpponents(filter) });

export const Route = createFileRoute("/opponents")({
  component: OpponentsPage,
});

type SortKey = "opponent" | "matches" | "wins" | "losses" | "winPct" | "lastMatch";

function OpponentsPage() {
  const { filter } = useMatchFilter();
  const { data } = useSuspenseQuery(opponentsOptions(filter));
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("matches");
  const [dir, setDir] = React.useState<"asc" | "desc">("desc");

  const rows = data
    .filter((r) => r.opponent.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = a[sort]; const bv = b[sort];
      if (av == null) return 1; if (bv == null) return -1;
      if (typeof av === "string" && typeof bv === "string") return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return dir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

  const toggleSort = (k: SortKey) => {
    if (sort === k) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSort(k); setDir("desc"); }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl uppercase italic">Opponents</h1>
          <p className="mt-2 text-slate-500">Head-to-head record vs every opponent.</p>
        </div>
        <div className="rounded-xl bg-estonia-dark p-1"><MatchTypeFilterBar /></div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search opponent…"
          className="w-full max-w-xs rounded-md border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <Th sort={sort} dir={dir} k="opponent" onClick={toggleSort}>Opponent</Th>
              <Th sort={sort} dir={dir} k="matches" onClick={toggleSort}>Matches</Th>
              <Th sort={sort} dir={dir} k="wins" onClick={toggleSort}>Wins</Th>
              <Th sort={sort} dir={dir} k="losses" onClick={toggleSort}>Losses</Th>
              <th className="p-3">Sets</th>
              <Th sort={sort} dir={dir} k="winPct" onClick={toggleSort}>Win %</Th>
              <Th sort={sort} dir={dir} k="lastMatch" onClick={toggleSort}>Last</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.opponent} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="p-3 font-medium">
                  <Link to="/opponents/$opponent" params={{ opponent: o.opponent }} className="hover:text-estonia-blue">
                    {o.opponent}
                  </Link>
                </td>
                <td className="p-3">{o.matches}</td>
                <td className="p-3 text-green-600">{o.wins}</td>
                <td className="p-3 text-red-500">{o.losses}</td>
                <td className="p-3">{o.setsWon}-{o.setsLost}</td>
                <td className="p-3 font-semibold">{o.winPct}%</td>
                <td className="p-3 text-slate-500">{o.lastMatch ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, k, sort, dir, onClick }: { children: React.ReactNode; k: SortKey; sort: SortKey; dir: "asc" | "desc"; onClick: (k: SortKey) => void }) {
  const active = sort === k;
  return (
    <th className="p-3">
      <button onClick={() => onClick(k)} className={`flex items-center gap-1 uppercase ${active ? "text-estonia-blue" : ""}`}>
        {children} {active && (dir === "asc" ? "↑" : "↓")}
      </button>
    </th>
  );
}
