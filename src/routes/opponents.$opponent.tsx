import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMatchFilter, type MatchTypeFilter } from "@/lib/match-filter";

async function fetchOpponent(opponent: string, filter: MatchTypeFilter) {
  const q = supabase
    .from("matches")
    .select("match_id, match_date, competition, city, estonia_sets, opponent_sets, match_type")
    .eq("opponent", opponent)
    .order("match_date", { ascending: true });
  if (filter !== "ALL") q.eq("match_type", filter);
  const { data } = await q;
  const matches = data ?? [];

  let wins = 0, losses = 0, setsWon = 0, setsLost = 0;
  let curWin = 0, curLose = 0, longestWin = 0, longestLose = 0;
  matches.forEach((m) => {
    setsWon += m.estonia_sets ?? 0;
    setsLost += m.opponent_sets ?? 0;
    if ((m.estonia_sets ?? 0) > (m.opponent_sets ?? 0)) {
      wins += 1; curWin += 1; curLose = 0; longestWin = Math.max(longestWin, curWin);
    } else if ((m.estonia_sets ?? 0) < (m.opponent_sets ?? 0)) {
      losses += 1; curLose += 1; curWin = 0; longestLose = Math.max(longestLose, curLose);
    } else { curWin = 0; curLose = 0; }
  });

  return {
    matches,
    stats: {
      total: matches.length, wins, losses, setsWon, setsLost,
      winPct: matches.length ? Math.round((wins / matches.length) * 100) : 0,
      first: matches[0] ?? null,
      last: matches[matches.length - 1] ?? null,
      longestWin, longestLose,
    },
  };
}

const opponentOptions = (opponent: string, filter: MatchTypeFilter) =>
  queryOptions({ queryKey: ["opponent", opponent, filter], queryFn: () => fetchOpponent(opponent, filter) });

export const Route = createFileRoute("/opponents/$opponent")({
  component: OpponentDetailPage,
});

function OpponentDetailPage() {
  const { opponent } = Route.useParams();
  const { filter } = useMatchFilter();
  const { data } = useSuspenseQuery(opponentOptions(opponent, filter));
  const s = data.stats;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link to="/opponents" className="text-xs font-semibold uppercase tracking-wide text-estonia-blue hover:underline">
        ← All opponents
      </Link>
      <h1 className="mt-4 font-display text-5xl uppercase italic">Estonia vs {opponent}</h1>
      <p className="mt-2 text-slate-500">{s.total} matches · {s.wins}W – {s.losses}L · {s.winPct}% win rate</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MiniCard label="First meeting" primary={s.first ? s.first.match_date : "—"} secondary={s.first ? `${s.first.estonia_sets}-${s.first.opponent_sets}` : ""} />
        <MiniCard label="Most recent" primary={s.last ? s.last.match_date : "—"} secondary={s.last ? `${s.last.estonia_sets}-${s.last.opponent_sets}` : ""} />
        <MiniCard label="Longest winning streak" primary={String(s.longestWin)} secondary="matches" />
        <MiniCard label="Longest losing streak" primary={String(s.longestLose)} secondary="matches" />
      </div>

      <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-display text-xl uppercase italic">All matches</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {[...data.matches].reverse().map((m) => {
            const won = m.estonia_sets > m.opponent_sets;
            return (
              <Link
                key={m.match_id}
                to="/matches/$matchId"
                params={{ matchId: String(m.match_id) }}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50"
              >
                <div>
                  <div className="font-semibold">{m.competition ?? "—"}</div>
                  <div className="text-sm text-slate-500">{m.match_date}{m.city ? ` · ${m.city}` : ""}</div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${won ? "text-estonia-blue" : "text-slate-500"}`}>{m.estonia_sets}-{m.opponent_sets}</div>
                  <div className="text-[10px] uppercase text-slate-400">{m.match_type}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function MiniCard({ label, primary, secondary }: { label: string; primary: string; secondary?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-2 font-display text-2xl">{primary}</div>
      {secondary && <div className="mt-1 text-xs text-slate-500">{secondary}</div>}
    </div>
  );
}
