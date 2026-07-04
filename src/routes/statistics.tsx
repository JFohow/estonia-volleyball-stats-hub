import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMatchFilter, type MatchTypeFilter } from "@/lib/match-filter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

async function fetchStats(filter: MatchTypeFilter) {
  const q = supabase.from("matches").select("match_id, match_date, opponent, estonia_sets, opponent_sets, match_type");
  if (filter !== "ALL") q.eq("match_type", filter);
  const [{ data: matches }, { data: appearances }, { data: players }] = await Promise.all([
    q,
    supabase.from("appearances").select("player_id, match_id"),
    supabase.from("players").select("player_id, first_name, last_name, position"),
  ]);

  const matchIds = new Set((matches ?? []).map((m) => m.match_id));
  const filteredApps = (appearances ?? []).filter((a) => matchIds.has(a.match_id));

  const byYear = new Map<string, { year: string; matches: number; wins: number }>();
  const oppCount = new Map<string, number>();
  const typeCount: Record<string, number> = { VM: 0, AM: 0, MAM: 0 };

  (matches ?? []).forEach((m) => {
    const y = m.match_date.slice(0, 4);
    const cur = byYear.get(y) ?? { year: y, matches: 0, wins: 0 };
    cur.matches += 1;
    if ((m.estonia_sets ?? 0) > (m.opponent_sets ?? 0)) cur.wins += 1;
    byYear.set(y, cur);
    oppCount.set(m.opponent, (oppCount.get(m.opponent) ?? 0) + 1);
    typeCount[m.match_type] = (typeCount[m.match_type] ?? 0) + 1;
  });

  const yearRows = [...byYear.values()].sort((a, b) => a.year.localeCompare(b.year))
    .map((y) => ({ ...y, winPct: y.matches ? Math.round((y.wins / y.matches) * 100) : 0 }));

  const topOpponents = [...oppCount.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([opponent, count]) => ({ opponent, count }));

  const playerMap = new Map((players ?? []).map((p) => [p.player_id, p]));
  const appsByPlayer = new Map<number, number>();
  const posCount = new Map<string, number>();
  filteredApps.forEach((a) => {
    appsByPlayer.set(a.player_id, (appsByPlayer.get(a.player_id) ?? 0) + 1);
  });
  appsByPlayer.forEach((_, pid) => {
    const pos = playerMap.get(pid)?.position ?? "Unknown";
    posCount.set(pos, (posCount.get(pos) ?? 0) + 1);
  });

  const topPlayers = [...appsByPlayer.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([pid, count]) => {
      const p = playerMap.get(pid);
      return { name: p ? `${p.first_name} ${p.last_name}` : `#${pid}`, count };
    });

  return {
    yearRows,
    topOpponents,
    typeDistribution: Object.entries(typeCount).map(([name, value]) => ({ name, value })),
    positionDistribution: [...posCount.entries()].map(([name, value]) => ({ name, value })),
    topPlayers,
  };
}

const statsOptions = (filter: MatchTypeFilter) =>
  queryOptions({ queryKey: ["stats-dashboard", filter], queryFn: () => fetchStats(filter) });

export const Route = createFileRoute("/statistics")({
  component: StatisticsPage,
});

const COLORS = ["#0072ce", "#002d54", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

function StatisticsPage() {
  const { filter } = useMatchFilter();
  const { data } = useSuspenseQuery(statsOptions(filter));

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="font-display text-5xl uppercase italic">Statistics</h1>
      <p className="mt-2 text-slate-500">Visual overview {filter !== "ALL" && `(${filter} matches only)`}.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Matches by year">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.yearRows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="year" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="matches" fill="#0072ce" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Win % by year">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.yearRows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="year" fontSize={11} />
              <YAxis domain={[0, 100]} fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="winPct" stroke="#0072ce" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 10 opponents">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.topOpponents} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis type="number" fontSize={11} />
              <YAxis type="category" dataKey="opponent" fontSize={11} width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#002d54" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Match types">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data.typeDistribution} dataKey="value" nameKey="name" outerRadius={90} label>
                {data.typeDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Appearances by position">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data.positionDistribution} dataKey="value" nameKey="name" outerRadius={90} label>
                {data.positionDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 10 players by appearances">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.topPlayers} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis type="number" fontSize={11} />
              <YAxis type="category" dataKey="name" fontSize={11} width={120} />
              <Tooltip />
              <Bar dataKey="count" fill="#0072ce" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="font-display text-lg uppercase italic">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}
