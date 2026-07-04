import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMatchFilter, type MatchTypeFilter } from "@/lib/match-filter";

type PlayerRow = { player_id: number; first_name: string; last_name: string; position: string | null };

type Aggregate = {
  player: PlayerRow;
  appearances: number;
  sets_played: number;
  sets_started: number;
  captaincies: number;
  points: number;
  aces: number;
  blocks: number;
  kills: number;
};

async function fetchRecords(filter: MatchTypeFilter) {
  // matches (filtered)
  const matchesQ = supabase.from("matches").select("match_id, match_date, opponent, estonia_sets, opponent_sets, match_type");
  if (filter !== "ALL") matchesQ.eq("match_type", filter);
  const { data: matches } = await matchesQ;
  const matchIds = new Set((matches ?? []).map((m) => m.match_id));

  const [{ data: appearances }, { data: stats }, { data: players }] = await Promise.all([
    supabase.from("appearances").select("appearance_id, player_id, match_id, sets_played, sets_started, captain"),
    supabase.from("player_match_stats").select("appearance_id, points, serve_aces, block_points, attack_kills"),
    supabase.from("players").select("player_id, first_name, last_name, position"),
  ]);

  const playerMap = new Map<number, PlayerRow>();
  (players ?? []).forEach((p) => playerMap.set(p.player_id, p));

  const filteredApps = (appearances ?? []).filter((a) => matchIds.has(a.match_id));
  const appIdToPlayer = new Map<number, number>();
  const perPlayer = new Map<number, Aggregate>();

  filteredApps.forEach((a) => {
    appIdToPlayer.set(a.appearance_id, a.player_id);
    const p = playerMap.get(a.player_id);
    if (!p) return;
    const cur =
      perPlayer.get(a.player_id) ??
      ({
        player: p,
        appearances: 0,
        sets_played: 0,
        sets_started: 0,
        captaincies: 0,
        points: 0,
        aces: 0,
        blocks: 0,
        kills: 0,
      } as Aggregate);
    cur.appearances += 1;
    cur.sets_played += a.sets_played ?? 0;
    cur.sets_started += a.sets_started ?? 0;
    if (a.captain) cur.captaincies += 1;
    perPlayer.set(a.player_id, cur);
  });

  (stats ?? []).forEach((s) => {
    const pid = appIdToPlayer.get(s.appearance_id);
    if (!pid) return;
    const cur = perPlayer.get(pid);
    if (!cur) return;
    cur.points += s.points ?? 0;
    cur.aces += s.serve_aces ?? 0;
    cur.blocks += s.block_points ?? 0;
    cur.kills += s.attack_kills ?? 0;
  });

  // team records
  const filteredMatches = matches ?? [];
  const opponentCount = new Map<string, number>();
  filteredMatches.forEach((m) => opponentCount.set(m.opponent, (opponentCount.get(m.opponent) ?? 0) + 1));
  const mostPlayed = [...opponentCount.entries()].sort((a, b) => b[1] - a[1])[0];

  const withMargin = filteredMatches.map((m) => ({ ...m, margin: (m.estonia_sets ?? 0) - (m.opponent_sets ?? 0) }));
  const biggestWin = [...withMargin].sort((a, b) => b.margin - a.margin)[0];
  const biggestLoss = [...withMargin].sort((a, b) => a.margin - b.margin)[0];

  const chrono = [...filteredMatches].sort((a, b) => a.match_date.localeCompare(b.match_date));
  let winStreak = 0, loseStreak = 0, curWin = 0, curLose = 0;
  chrono.forEach((m) => {
    if ((m.estonia_sets ?? 0) > (m.opponent_sets ?? 0)) {
      curWin += 1; curLose = 0;
      winStreak = Math.max(winStreak, curWin);
    } else if ((m.estonia_sets ?? 0) < (m.opponent_sets ?? 0)) {
      curLose += 1; curWin = 0;
      loseStreak = Math.max(loseStreak, curLose);
    } else {
      curWin = 0; curLose = 0;
    }
  });

  return {
    aggregates: [...perPlayer.values()],
    team: {
      mostPlayed: mostPlayed ? { opponent: mostPlayed[0], count: mostPlayed[1] } : null,
      biggestWin: biggestWin ?? null,
      biggestLoss: biggestLoss ?? null,
      winStreak,
      loseStreak,
    },
  };
}

const recordsOptions = (filter: MatchTypeFilter) =>
  queryOptions({ queryKey: ["records", filter], queryFn: () => fetchRecords(filter) });

export const Route = createFileRoute("/records")({
  component: RecordsPage,
});

function leader(arr: Aggregate[], selector: (a: Aggregate) => number) {
  return [...arr].sort((a, b) => selector(b) - selector(a))[0];
}

function RecordsPage() {
  const { filter } = useMatchFilter();
  const { data } = useSuspenseQuery(recordsOptions(filter));

  const cards = [
    { title: "Most Appearances", ...pick(leader(data.aggregates, (a) => a.appearances), (a) => a.appearances) },
    { title: "Most Sets Played", ...pick(leader(data.aggregates, (a) => a.sets_played), (a) => a.sets_played) },
    { title: "Most Sets Started", ...pick(leader(data.aggregates, (a) => a.sets_started), (a) => a.sets_started) },
    { title: "Most Captaincies", ...pick(leader(data.aggregates, (a) => a.captaincies), (a) => a.captaincies) },
    { title: "Most Points", ...pick(leader(data.aggregates, (a) => a.points), (a) => a.points) },
    { title: "Most Aces", ...pick(leader(data.aggregates, (a) => a.aces), (a) => a.aces) },
    { title: "Most Blocks", ...pick(leader(data.aggregates, (a) => a.blocks), (a) => a.blocks) },
    { title: "Most Attack Kills", ...pick(leader(data.aggregates, (a) => a.kills), (a) => a.kills) },
  ];

  const team = data.team;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="font-display text-5xl uppercase italic">Records</h1>
      <p className="mt-2 text-slate-500">
        All-time Estonia Men's National Team leaders {filter !== "ALL" && `(${filter} matches only)`}.
      </p>

      <h2 className="mt-10 font-display text-2xl uppercase italic">Player records</h2>
      <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            to={card.player ? "/player/$playerId" : "/records"}
            params={card.player ? { playerId: String(card.player.player_id) } : (undefined as any)}
            className="block rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-estonia-blue hover:shadow-md"
          >
            <div className="text-xs uppercase tracking-widest text-estonia-blue">{card.title}</div>
            <div className="mt-3 flex items-center gap-3">
              {card.player && (
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-estonia-dark text-xs font-bold text-white">
                  {card.player.first_name[0]}{card.player.last_name[0]}
                </div>
              )}
              <div className="text-lg font-bold leading-tight">
                {card.player ? `${card.player.first_name} ${card.player.last_name}` : "—"}
              </div>
            </div>
            <div className="mt-3 font-display text-4xl">{card.value.toLocaleString()}</div>
            <div className="mt-1 text-xs text-slate-500">{card.player?.position ?? ""}</div>
          </Link>
        ))}
      </div>

      <h2 className="mt-12 font-display text-2xl uppercase italic">Team records</h2>
      <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <TeamCard title="Most Played Opponent" primary={team.mostPlayed?.opponent ?? "—"} value={team.mostPlayed?.count ?? 0} suffix="matches" />
        <TeamCard
          title="Biggest Win"
          primary={team.biggestWin ? `vs ${team.biggestWin.opponent}` : "—"}
          value={team.biggestWin ? `${team.biggestWin.estonia_sets}-${team.biggestWin.opponent_sets}` : "—"}
          suffix={team.biggestWin?.match_date ?? ""}
        />
        <TeamCard
          title="Biggest Loss"
          primary={team.biggestLoss ? `vs ${team.biggestLoss.opponent}` : "—"}
          value={team.biggestLoss ? `${team.biggestLoss.estonia_sets}-${team.biggestLoss.opponent_sets}` : "—"}
          suffix={team.biggestLoss?.match_date ?? ""}
        />
        <TeamCard title="Longest Winning Streak" primary="Consecutive wins" value={team.winStreak} suffix="matches" />
        <TeamCard title="Longest Losing Streak" primary="Consecutive losses" value={team.loseStreak} suffix="matches" />
      </div>
    </div>
  );
}

function pick(a: Aggregate | undefined, sel: (a: Aggregate) => number) {
  return { player: a?.player ?? null, value: a ? sel(a) : 0 };
}

function TeamCard({ title, primary, value, suffix }: { title: string; primary: string; value: number | string; suffix?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-xs uppercase tracking-widest text-estonia-blue">{title}</div>
      <div className="mt-3 text-lg font-bold">{primary}</div>
      <div className="mt-2 font-display text-4xl">{value}</div>
      {suffix && <div className="mt-1 text-xs text-slate-500">{suffix}</div>}
    </div>
  );
}
