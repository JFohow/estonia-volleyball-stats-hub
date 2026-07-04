import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as React from "react";

async function fetchPlayer(playerId: number) {
  const [{ data: player }, { data: appearances }] = await Promise.all([
    supabase.from("players").select("*").eq("player_id", playerId).maybeSingle(),
    supabase
      .from("appearances")
      .select(
        "appearance_id, sets_played, sets_started, captain, matches(match_id, match_date, opponent, competition, city, estonia_sets, opponent_sets, match_type)",
      )
      .eq("player_id", playerId),
  ]);

  const appIds = (appearances ?? []).map((a) => a.appearance_id);
  const { data: stats } = appIds.length
    ? await supabase.from("player_match_stats").select("*").in("appearance_id", appIds)
    : { data: [] as any[] };

  return { player, appearances: appearances ?? [], stats: stats ?? [] };
}

const playerOptions = (playerId: number) =>
  queryOptions({ queryKey: ["player-detail", playerId], queryFn: () => fetchPlayer(playerId) });

export const Route = createFileRoute("/player/$playerId")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(playerOptions(Number(params.playerId))),
  component: PlayerPage,
  errorComponent: () => <div className="p-10">Could not load player.</div>,
  notFoundComponent: () => <div className="p-10">Player not found.</div>,
});

function PlayerPage() {
  const { playerId } = Route.useParams();
  const { data } = useSuspenseQuery(playerOptions(Number(playerId)));
  const [oppFilter, setOppFilter] = React.useState("");
  const [compFilter, setCompFilter] = React.useState("");
  const [yearFilter, setYearFilter] = React.useState("");

  if (!data.player) return <div className="mx-auto max-w-5xl px-6 py-12">Player not found</div>;
  const p = data.player;

  const statByApp = new Map(data.stats.map((s) => [s.appearance_id, s]));
  let captaincies = 0, setsPlayed = 0, setsStarted = 0, points = 0, aces = 0, blocks = 0, kills = 0;
  data.appearances.forEach((a) => {
    if (a.captain) captaincies += 1;
    setsPlayed += a.sets_played ?? 0;
    setsStarted += a.sets_started ?? 0;
    const s = statByApp.get(a.appearance_id);
    if (s) {
      points += s.points ?? 0;
      aces += s.serve_aces ?? 0;
      blocks += s.block_points ?? 0;
      kills += s.attack_kills ?? 0;
    }
  });

  const sortedApps = [...data.appearances]
    .filter((a: any) => a.matches)
    .sort((a: any, b: any) => a.matches.match_date.localeCompare(b.matches.match_date));
  const firstApp = sortedApps[0]?.matches;
  const lastApp = sortedApps[sortedApps.length - 1]?.matches;

  const opponents = [...new Set(sortedApps.map((a: any) => a.matches.opponent))].sort();
  const competitions = [...new Set(sortedApps.map((a: any) => a.matches.competition).filter(Boolean))].sort() as string[];
  const years = [...new Set(sortedApps.map((a: any) => a.matches.match_date.slice(0, 4)))].sort().reverse();

  const timelineByYear = new Map<string, number>();
  sortedApps.forEach((a: any) => {
    const y = a.matches.match_date.slice(0, 4);
    timelineByYear.set(y, (timelineByYear.get(y) ?? 0) + 1);
  });
  const timeline = [...timelineByYear.entries()].sort();
  const maxYearApps = Math.max(1, ...timeline.map(([, n]) => n));

  const filteredApps = sortedApps
    .filter((a: any) =>
      (oppFilter ? a.matches.opponent === oppFilter : true) &&
      (compFilter ? a.matches.competition === compFilter : true) &&
      (yearFilter ? a.matches.match_date.startsWith(yearFilter) : true),
    )
    .reverse();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link to="/players" className="text-xs font-semibold uppercase tracking-wide text-estonia-blue hover:underline">
        ← All players
      </Link>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-estonia-dark text-3xl font-bold text-white md:h-32 md:w-32 md:text-4xl">
            {p.first_name?.[0]}{p.last_name?.[0]}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-3xl uppercase italic md:text-4xl">{p.first_name} {p.last_name}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.position && <Tag>{p.position}</Tag>}
              {p.height_cm && <Tag>{p.height_cm} cm</Tag>}
              {p.handedness && <Tag className="capitalize">{p.handedness}-handed</Tag>}
              {p.birth_date && <Tag>Born {p.birth_date}</Tag>}
              {p.place_of_birth && <Tag>{p.place_of_birth}</Tag>}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
              <StatCard label="Appearances" value={data.appearances.length} />
              <StatCard label="Sets Played" value={setsPlayed} />
              <StatCard label="Sets Started" value={setsStarted} />
              <StatCard label="Captaincies" value={captaincies} />
              <StatCard label="Points" value={points} />
              <StatCard label="Aces" value={aces} />
              <StatCard label="Blocks" value={blocks} />
              <StatCard label="Attack Kills" value={kills} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">First national team appearance</div>
          {firstApp ? (
            <Link to="/matches/$matchId" params={{ matchId: String(firstApp.match_id) }} className="mt-2 block">
              <div className="text-lg font-bold hover:text-estonia-blue">vs {firstApp.opponent}</div>
              <div className="text-sm text-slate-500">{firstApp.competition ?? "—"} · {firstApp.match_date}</div>
            </Link>
          ) : <div className="mt-2 text-slate-400">—</div>}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Last national team appearance</div>
          {lastApp ? (
            <Link to="/matches/$matchId" params={{ matchId: String(lastApp.match_id) }} className="mt-2 block">
              <div className="text-lg font-bold hover:text-estonia-blue">vs {lastApp.opponent}</div>
              <div className="text-sm text-slate-500">{lastApp.competition ?? "—"} · {lastApp.match_date}</div>
            </Link>
          ) : <div className="mt-2 text-slate-400">—</div>}
        </div>
      </div>

      {timeline.length > 0 && (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-xl uppercase italic">Career timeline</h2>
          <div className="mt-4 flex items-end gap-2 overflow-x-auto pb-2">
            {timeline.map(([year, count]) => (
              <div key={year} className="flex flex-col items-center">
                <div
                  className="w-8 rounded-t bg-estonia-blue"
                  style={{ height: `${(count / maxYearApps) * 80 + 8}px` }}
                  title={`${count} appearances`}
                />
                <div className="mt-1 text-[10px] text-slate-500">{year}</div>
                <div className="text-[10px] font-bold">{count}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <h2 className="font-display text-xl uppercase italic">Match history</h2>
          <div className="flex flex-wrap gap-2">
            <MiniSelect label="Opponent" value={oppFilter} onChange={setOppFilter} options={opponents} />
            <MiniSelect label="Competition" value={compFilter} onChange={setCompFilter} options={competitions} />
            <MiniSelect label="Year" value={yearFilter} onChange={setYearFilter} options={years} />
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {filteredApps.length === 0 && <div className="p-8 text-center text-slate-400">No matches match your filters</div>}
          {filteredApps.map((a: any) => {
            const s = statByApp.get(a.appearance_id);
            const m = a.matches;
            return (
              <Link
                key={a.appearance_id}
                to="/matches/$matchId"
                params={{ matchId: String(m.match_id) }}
                className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-slate-50"
              >
                <div>
                  <div className="font-semibold">vs {m.opponent}</div>
                  <div className="text-sm text-slate-500">{m.competition ?? "—"} · {m.match_date}</div>
                </div>
                <div className="hidden gap-6 text-xs text-slate-500 md:flex">
                  <span>Sets: <b className="text-slate-800">{a.sets_played}</b></span>
                  {s?.points != null && <span>Pts: <b className="text-slate-800">{s.points}</b></span>}
                  {s?.attack_kills != null && <span>Kills: <b className="text-slate-800">{s.attack_kills}</b></span>}
                </div>
                <div className="text-right">
                  <div className="font-bold">{m.estonia_sets}-{m.opponent_sets}</div>
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

function Tag({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`rounded bg-slate-100 px-3 py-1 text-sm ${className}`}>{children}</span>;
}
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="font-display text-2xl">{value.toLocaleString()}</div>
      <div className="mt-1 text-[10px] font-bold uppercase text-slate-400">{label}</div>
    </div>
  );
}
function MiniSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="flex items-center gap-1 text-xs">
      <span className="text-slate-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded border border-slate-200 bg-white px-2 py-1">
        <option value="">All</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
