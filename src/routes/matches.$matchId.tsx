import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function fetchMatch(matchId: number) {
  const [{ data: match }, { data: sets }, { data: appearances }] = await Promise.all([
    supabase.from("matches").select("*").eq("match_id", matchId).maybeSingle(),
    supabase.from("match_sets").select("*").eq("match_id", matchId).order("set_number"),
    supabase
      .from("appearances")
      .select("appearance_id, player_id, shirt_number, captain, sets_played, sets_started, on_the_bench, player_position_in_match, players(first_name, last_name, position)")
      .eq("match_id", matchId),
  ]);

  const appearanceIds = (appearances ?? []).map((a) => a.appearance_id);
  const { data: stats } = appearanceIds.length
    ? await supabase.from("player_match_stats").select("*").in("appearance_id", appearanceIds)
    : { data: [] as any[] };

  return { match, sets: sets ?? [], appearances: appearances ?? [], stats: stats ?? [] };
}

const matchOptions = (matchId: number) =>
  queryOptions({ queryKey: ["match-detail", matchId], queryFn: () => fetchMatch(matchId) });

export const Route = createFileRoute("/matches/$matchId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(matchOptions(Number(params.matchId))),
  component: MatchDetailPage,
  errorComponent: () => <div className="p-10">Could not load match.</div>,
  notFoundComponent: () => <div className="p-10">Match not found.</div>,
});

function MatchDetailPage() {
  const { matchId } = Route.useParams();
  const { data } = useSuspenseQuery(matchOptions(Number(matchId)));
  const { match, sets, appearances, stats } = data;

  if (!match) return <div className="p-10">Match not found.</div>;

  const won = match.estonia_sets > match.opponent_sets;
  const officialSets = sets.filter((s) => s.set_number <= match.estonia_sets + match.opponent_sets);
  const additionalSets = sets.filter((s) => s.set_number > match.estonia_sets + match.opponent_sets);
  const captain = appearances.find((a) => a.captain);
  const statByApp = new Map(stats.map((s) => [s.appearance_id, s]));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link to="/matches" className="text-xs font-semibold uppercase tracking-wide text-estonia-blue hover:underline">
        ← Match archive
      </Link>

      <header className="mt-4 rounded-xl bg-estonia-dark p-8 text-white">
        <div className="text-xs uppercase tracking-widest opacity-70">
          {match.competition ?? "—"} · {match.match_date} · {match.city ?? "—"} · <span className="rounded bg-white/10 px-2 py-0.5">{match.match_type}</span>
        </div>
        <div className="mt-4 flex items-center gap-6 font-display text-4xl uppercase italic md:text-6xl">
          <span>Estonia</span>
          <span className={won ? "text-estonia-blue" : "text-white/70"}>{match.estonia_sets}</span>
          <span className="text-white/40">-</span>
          <span className={!won ? "text-estonia-blue" : "text-white/70"}>{match.opponent_sets}</span>
          <span>{match.opponent}</span>
        </div>
        {match.coach && <div className="mt-3 text-sm opacity-70">Coach: {match.coach}</div>}
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <SummaryCard label="Official sets" value={officialSets.length} />
        <SummaryCard label="Training sets" value={additionalSets.length} />
        <SummaryCard label="Players used" value={appearances.length} />
        <SummaryCard label="Captain" value={captain ? `#${captain.shirt_number ?? "—"} ${(captain as any).players?.last_name ?? ""}` : "—"} />
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-xl uppercase italic">Set scores</h2>
        <div className="mt-4 flex flex-wrap gap-6">
          {officialSets.map((s) => (
            <div key={s.match_set_id} className="rounded-lg border border-slate-200 px-4 py-3 text-center">
              <div className="text-xs font-semibold uppercase text-slate-400">Set {s.set_number}</div>
              <div className="mt-1 font-display text-2xl">{s.estonia_points}-{s.opponent_points}</div>
            </div>
          ))}
          {additionalSets.length > 0 && (
            <div className="rounded-lg border-2 border-dashed border-estonia-blue/30 p-3">
              <div className="text-xs font-semibold uppercase text-estonia-blue">Additional training</div>
              <div className="mt-1 flex gap-3">
                {additionalSets.map((s) => (
                  <span key={s.match_set_id} className="font-display text-lg text-slate-600">
                    {s.estonia_points}-{s.opponent_points}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-display text-xl uppercase italic">Player appearances</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Player</th>
                <th className="p-3">Pos</th>
                <th className="p-3 text-right">Sets</th>
                <th className="p-3 text-right">Started</th>
                <th className="p-3 text-right">Points</th>
                <th className="p-3 text-right">Kills</th>
                <th className="p-3 text-right">Aces</th>
                <th className="p-3 text-right">Blocks</th>
              </tr>
            </thead>
            <tbody>
              {appearances.map((a: any) => {
                const s = statByApp.get(a.appearance_id);
                return (
                  <tr key={a.appearance_id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3 text-slate-500">{a.shirt_number ?? "—"}</td>
                    <td className="p-3 font-medium">
                      <Link to="/player/$playerId" params={{ playerId: String(a.player_id) }} className="hover:text-estonia-blue">
                        {a.players?.first_name} {a.players?.last_name}
                      </Link>
                      {a.captain && <span className="ml-2 rounded bg-estonia-blue px-1.5 py-0.5 text-[10px] font-bold text-white">C</span>}
                      {a.on_the_bench && <span className="ml-2 text-[10px] uppercase text-slate-400">bench</span>}
                    </td>
                    <td className="p-3 text-slate-500">{a.player_position_in_match ?? a.players?.position ?? "—"}</td>
                    <td className="p-3 text-right">{a.sets_played}</td>
                    <td className="p-3 text-right">{a.sets_started}</td>
                    <td className="p-3 text-right">{s?.points ?? "—"}</td>
                    <td className="p-3 text-right">{s?.attack_kills ?? "—"}</td>
                    <td className="p-3 text-right">{s?.serve_aces ?? "—"}</td>
                    <td className="p-3 text-right">{s?.block_points ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-1 font-display text-2xl">{value}</div>
    </div>
  );
}
