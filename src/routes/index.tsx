import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryErrorResetBoundary } from "@tanstack/react-query";
import { homeSummaryOptions, type RecentMatch } from "@/lib/home.queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Eesti Võrkpall DB — Estonia Men's National Volleyball Archive" },
      {
        name: "description",
        content:
          "Every match, player, and statistic from the Estonia Men's National Volleyball Team, in one browsable archive.",
      },
    ],
  }),
  component: HomePage,
  errorComponent: HomeError,
});

function HomeError({ error, reset }: { error: Error; reset: () => void }) {
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

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

function HomePage() {
  const { data } = useSuspenseQuery(homeSummaryOptions());
  const coveragePct =
    data.statsCoverage.totalMatches > 0
      ? Math.round((data.statsCoverage.matchesWithStats / data.statsCoverage.totalMatches) * 100)
      : 0;

  const playerCoveragePct =
    data.playerCoverage.totalMatches > 0
      ? Math.round(
        (data.playerCoverage.matchesWithPlayers /
          data.playerCoverage.totalMatches) * 100
      )
      : 0;

  const kpis = [
    { label: "Total Matches", value: data.totalMatches },
    { label: "Total Players", value: data.totalPlayers },
    { label: "Appearances", value: data.totalAppearances },
    { label: "Sets Played", value: data.totalSets },
  ];

  return (
    <div className="text-slate-900">
      {/* Hero Metrics */}
      <header className="bg-estonia-dark px-6 pt-12 pb-24 text-white">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-3 font-display text-5xl uppercase italic md:text-6xl">
            National Team <span className="text-estonia-blue">Historical Database</span>
          </h1>
          <p className="mb-12 max-w-2xl text-sm text-white/60">
            Every match, every set, every appearance of the Estonia Men's National Volleyball Team,
            preserved and searchable.
          </p>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
            {kpis.map((k) => (
              <div key={k.label} className="border-l-2 border-estonia-blue pl-4">
                <div className="font-display text-4xl md:text-5xl">{fmt(k.value)}</div>
                <div className="mt-1 text-xs uppercase tracking-widest opacity-60">{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto -mt-12 max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Recent Matches */}
          <div className="space-y-6 lg:col-span-2">
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <h2 className="font-display text-xl uppercase italic">
                  Recent Matches
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {data.recentMatches.length === 0 ? (
                  <EmptyMatches />
                ) : (
                  data.recentMatches.map((m) => <MatchRow key={m.match_id} match={m} />)
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 font-display text-lg uppercase italic">Record Appearance</h2>
              {data.topAppearance ? (
                <div className="flex gap-4">
                  <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-estonia-dark font-display text-2xl text-white">
                    {data.topAppearance.first_name[0]}
                    {data.topAppearance.last_name[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold uppercase leading-tight">
                      {data.topAppearance.first_name} {data.topAppearance.last_name}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-estonia-blue">
                      {data.topAppearance.position ?? "—"}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <div className="font-display text-2xl">{fmt(data.topAppearance.matches)}</div>
                        <div className="text-[10px] font-bold uppercase text-slate-400">Matches</div>
                      </div>
                      <div>
                        <div className="font-display text-2xl">{fmt(data.topAppearance.sets)}</div>
                        <div className="text-[10px] font-bold uppercase text-slate-400">Sets</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  Player appearance rankings will appear here once appearance data is loaded.
                </p>
              )}
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-slate-900 px-6 py-3 font-display text-sm uppercase tracking-widest text-white">
                Data Coverage Status
              </div>
              <div className="space-y-4 p-6">
                <CoverageBar
                  label="Match Results"
                  pct={data.totalMatches > 0 ? 100 : 0}
                  color="green"
                />
                <CoverageBar
                  label="Matches With Player Lists"
                  pct={playerCoveragePct}
                  color={playerCoveragePct >= 80 ? "green" : "amber"}
                />
                <CoverageBar
                  label="Full Match Statistics"
                  pct={coveragePct}
                  color={coveragePct >= 80 ? "green" : "amber"}
                />
                <p className="pt-2 text-[11px] leading-relaxed text-slate-400">
                  {data.statsCoverage.matchesWithStats.toLocaleString()} appearances with detailed
                  box-score data across {data.statsCoverage.totalMatches.toLocaleString()} archived
                  matches.
                </p>
              </div>
            </section>

            <div className="rounded-xl border border-estonia-blue/20 bg-estonia-blue/10 p-4">
              <div className="flex gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded bg-estonia-blue text-xs font-bold uppercase text-white">
                  Tip
                </div>
                <p className="text-xs leading-normal text-estonia-dark">
                  <strong>ALL vs AM:</strong> Matches with additional training sets are stored in
                  two versions. Filter by <strong>AM</strong> to see only official international
                  results.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function MatchRow({ match }: { match: RecentMatch }) {
  const won = match.estonia_sets > match.opponent_sets;
  const typeStyles: Record<string, string> = {
    VM: "bg-green-100 text-green-700",
    AM: "bg-slate-100 text-slate-600",
    MAM: "bg-amber-100 text-amber-700",
    "—": "bg-slate-100 text-slate-500",
  };
  const typeLabels: Record<string, string> = {
    VM: "Competitive Game",
    AM: "Official Game",
    MAM: "Non-official Game",
    "—": "Unknown",
  };
  const officialSets = match.match_sets
    .filter((s) => s.set_number <= match.estonia_sets + match.opponent_sets)
    .sort((a, b) => a.set_number - b.set_number);
  const matchType =
    match.vm ? "VM" :
      match.am ? "AM" :
        match.mam ? "MAM" :
          "—";
  return (
    <div className="p-6 transition-colors hover:bg-slate-50">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase text-slate-400">
            {match.competition ?? "—"} • {new Date(match.match_date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            {match.city ? ` • ${match.city}` : ""}
          </div>
          <div className="flex items-center gap-3 text-lg font-bold">
            ESTONIA
            <span className={won ? "text-estonia-blue" : "text-red-700"}>
              {match.estonia_sets} – {match.opponent_sets}
            </span>
            <span className="uppercase">{match.opponent}</span>
          </div>
        </div>
        <span
          className={`shrink-0 rounded px-2 py-1 text-xs font-bold ${typeStyles[matchType]}`}
        >
          {typeLabels[matchType]}
        </span>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-slate-500">
        {officialSets.map((s) => (
          <div key={s.set_number} className="flex flex-col">
            <span className="font-medium text-slate-800">
              {s.estonia_points}-{s.opponent_points}
            </span>
          </div>
        ))}
        {match.has_additional_sets && match.additional_sets_count > 0 && (
          <div className="flex flex-col border-l border-slate-200 pl-4">
            <span className="text-[10px] font-bold uppercase text-estonia-blue">Additional</span>
            <span className="font-medium text-slate-400">
              +{match.additional_sets_count} Training Sets
            </span>
          </div>
        )}
      </div>
    </div >
  );
}

function EmptyMatches() {
  return (
    <div className="p-12 text-center">
      <p className="font-display text-xl uppercase italic text-slate-400">Archive empty</p>
      <p className="mt-2 text-sm text-slate-500">
        No matches have been imported yet. Once match data is added to the database, recent results
        will appear here automatically.
      </p>
    </div>
  );
}

function CoverageBar({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: "green" | "amber";
}) {
  const barColor = color === "green" ? "bg-green-500" : "bg-amber-500";
  const textColor = color === "green" ? "text-green-600" : "text-amber-600";
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className={`text-sm font-bold ${textColor}`}>{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </>
  );
}
