import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryErrorResetBoundary } from "@tanstack/react-query";
import { homeSummaryOptions, type RecentMatch } from "@/lib/home.queries";
import { totalTopOptions, type TotalTopRow } from "@/lib/total-top.queries";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

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
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(homeSummaryOptions()),
      context.queryClient.ensureQueryData(totalTopOptions()),
    ]),
  component: HomePage,
  errorComponent: HomeError,
});

type TotalTopStatKey =
  | "appearances"
  | "sets"
  | "points"
  | "blockPoints"
  | "plusMinus"
  | "serveTotal"
  | "serveAces"
  | "serveErrors"
  | "receptionTotal"
  | "receptionErrors"
  | "receptionPositivePct"
  | "receptionExcellentPct"
  | "attackTotal"
  | "attackErrors"
  | "attackBlocked"
  | "attackKills"
  | "attackKillPct"
  | "attackEfficiency"
  | "breakPoints";

type TopLeaderCard = {
  stat: TotalTopStatKey;
  statLabel: string;
  row: TotalTopRow;
  value: number;
};

const topStatFields: Array<{ key: TotalTopStatKey; labelKey: string }> = [
  { key: "appearances", labelKey: "totalTop.metrics.mostAppearances" },
  { key: "sets", labelKey: "totalTop.metrics.mostSets" },
  { key: "points", labelKey: "totalTop.metrics.mostPoints" },
  { key: "breakPoints", labelKey: "totalTop.metrics.mostBreakPoints" },
  { key: "plusMinus", labelKey: "totalTop.metrics.bestPlusMinus" },
  { key: "serveTotal", labelKey: "totalTop.metrics.mostServes" },
  { key: "serveAces", labelKey: "totalTop.metrics.mostServeAces" },
  { key: "serveErrors", labelKey: "totalTop.metrics.mostServeErrors" },
  { key: "receptionTotal", labelKey: "totalTop.metrics.mostReceptions" },
  { key: "receptionErrors", labelKey: "totalTop.metrics.mostReceptionErrors" },
  { key: "receptionPositivePct", labelKey: "totalTop.metrics.bestReceptionPct" },
  { key: "receptionExcellentPct", labelKey: "totalTop.metrics.bestIdealReceptionPct" },
  { key: "attackTotal", labelKey: "totalTop.metrics.mostAttacks" },
  { key: "attackErrors", labelKey: "totalTop.metrics.mostAttackErrors" },
  { key: "attackBlocked", labelKey: "totalTop.metrics.mostAttackBlocks" },
  { key: "attackKills", labelKey: "totalTop.metrics.mostSuccessfulAttack" },
  { key: "attackKillPct", labelKey: "totalTop.metrics.bestAttackPct" },
  { key: "attackEfficiency", labelKey: "totalTop.metrics.bestAttackEffPct" },
  { key: "blockPoints", labelKey: "totalTop.metrics.mostBlockPoints" },
];

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
  const { t } = useTranslation();
  const { data } = useSuspenseQuery(homeSummaryOptions());
  const { data: totalTopRows } = useSuspenseQuery(totalTopOptions());
  const [activeLeaderIndex, setActiveLeaderIndex] = useState(0);
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

  const topLeaders = useMemo<TopLeaderCard[]>(() => {
    return topStatFields
      .map((field) => {
        const leader = totalTopRows.reduce<TotalTopRow | null>((best, row) => {
          const rowValue = row.all[field.key];
          if (!best) {
            return row;
          }
          return rowValue > best.all[field.key] ? row : best;
        }, null);

        if (!leader) {
          return null;
        }

        return {
          stat: field.key,
          statLabel: t(field.labelKey),
          row: leader,
          value: leader.all[field.key],
        };
      })
      .filter((leader): leader is TopLeaderCard => leader !== null);
  }, [t, totalTopRows]);

  useEffect(() => {
    if (topLeaders.length === 0) {
      setActiveLeaderIndex(0);
      return;
    }
    setActiveLeaderIndex((current) => current % topLeaders.length);
  }, [topLeaders.length]);

  useEffect(() => {
    if (topLeaders.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setActiveLeaderIndex((current) => {
        let next = current;
        while (next === current) {
          next = Math.floor(Math.random() * topLeaders.length);
        }
        return next;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [topLeaders.length]);

  const activeLeader = topLeaders.length > 0 ? topLeaders[activeLeaderIndex % topLeaders.length] : null;
  const leaderIsPercent = activeLeader
    ? activeLeader.stat === "receptionPositivePct" ||
    activeLeader.stat === "receptionExcellentPct" ||
    activeLeader.stat === "attackKillPct" ||
    activeLeader.stat === "attackEfficiency"
    : false;
  const canManuallyCycleLeaders = topLeaders.length > 1;

  function showPreviousLeader() {
    if (!canManuallyCycleLeaders) return;
    setActiveLeaderIndex((current) => (current - 1 + topLeaders.length) % topLeaders.length);
  }

  function showNextLeader() {
    if (!canManuallyCycleLeaders) return;
    setActiveLeaderIndex((current) => (current + 1) % topLeaders.length);
  }

  return (
    <div className="text-slate-900">
      {/* Hero Metrics */}
      <header className="bg-estonia-dark px-4 pt-10 pb-16 text-white sm:px-6 sm:pt-12 sm:pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-start md:gap-10">
            <div>
              <h1 className="mb-3 font-display text-4xl uppercase italic leading-tight sm:text-5xl md:text-6xl">
                {t("home.title")}{" "}
                <span className="text-estonia-blue">
                  {t("home.titleAccent")}
                </span>
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
                {t("home.subtitle")}
              </p>
            </div>

            <div className="w-full max-w-[1020px] rounded-xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm md:justify-self-center lg:justify-self-start">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3 border-b border-white/15 pb-2">
                  <span className="font-semibold text-white/80">{t("common.matches")}</span>
                  <span className="font-display text-3xl text-white">{fmt(data.totalMatches)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="font-semibold text-white/80">{t("nav.players")}</span>
                  <span className="font-display text-3xl text-white">{fmt(data.totalPlayers)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto -mt-8 max-w-7xl px-4 sm:-mt-12 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Recent Matches */}
          <div className="space-y-6 lg:col-span-2">
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4">
                <h2 className="font-display text-xl uppercase italic">
                  {t("home.recentMatches")}
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
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              {activeLeader ? (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white">
                  <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                    <button
                      type="button"
                      onClick={showPreviousLeader}
                      disabled={!canManuallyCycleLeaders}
                      aria-label="Previous metric"
                      className="h-8 w-8 rounded-full border border-slate-300 bg-white text-sm font-bold text-slate-600 transition hover:border-estonia-blue hover:text-estonia-blue disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      &lt;
                    </button>
                    <div className="px-2 text-center text-sm font-bold uppercase text-estonia-dark sm:text-base">{activeLeader.statLabel}</div>
                    <button
                      type="button"
                      onClick={showNextLeader}
                      disabled={!canManuallyCycleLeaders}
                      aria-label="Next metric"
                      className="h-8 w-8 rounded-full border border-slate-300 bg-white text-sm font-bold text-slate-600 transition hover:border-estonia-blue hover:text-estonia-blue disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      &gt;
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-4 px-4 py-4 text-center">
                    {activeLeader.row.photoUrl ? (
                      <img
                        src={activeLeader.row.photoUrl}
                        alt={activeLeader.row.name}
                        className="h-14 w-14 shrink-0 rounded-full border-2 border-estonia-blue/20 object-cover sm:h-16 sm:w-16"
                        loading="lazy"
                      />
                    ) : (
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-estonia-dark font-display text-lg text-white sm:h-16 sm:w-16 sm:text-xl">
                        {activeLeader.row.name.split(" ")[0]?.[0] ?? "?"}
                        {activeLeader.row.name.split(" ").slice(-1)[0]?.[0] ?? "?"}
                      </div>
                    )}
                    <div className="min-w-0 text-center">
                      <h3 className="truncate text-base font-bold uppercase leading-tight text-slate-900 sm:text-lg">
                        {activeLeader.row.name}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-estonia-blue">
                        {activeLeader.row.position ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 text-center">
                    <div className="font-display text-3xl text-estonia-dark sm:text-4xl">
                      {leaderIsPercent
                        ? `${Math.round(activeLeader.value)}%`
                        : Number.isInteger(activeLeader.value)
                          ? fmt(activeLeader.value)
                          : activeLeader.value.toFixed(1)}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  {t("home.noTopStatData")}
                </p>
              )}
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-slate-900 px-6 py-3 font-display text-sm uppercase tracking-widest text-white">
                {t("home.coverageStatus")}
              </div>
              <div className="space-y-4 p-4 sm:p-6">
                <CoverageBar
                  label={t("home.matchResults")}
                  pct={data.totalMatches > 0 ? 100 : 0}
                  color="green"
                />
                <CoverageBar
                  label={t("home.matchesWithPlayers")}
                  pct={playerCoveragePct}
                  color={playerCoveragePct >= 80 ? "green" : "amber"}
                />
                <CoverageBar
                  label={t("home.fullStatistics")}
                  pct={coveragePct}
                  color={coveragePct >= 80 ? "green" : "amber"}
                />
                <p className="pt-2 text-[11px] leading-relaxed text-slate-400">
                  {t("home.coverageSummary", {
                    matchesWithStats: data.statsCoverage.matchesWithStats.toLocaleString(),
                    totalMatches: data.statsCoverage.totalMatches.toLocaleString(),
                  })}
                </p>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

function MatchRow({ match }: { match: RecentMatch }) {
  const { t, i18n } = useTranslation();
  const won = match.estonia_sets > match.opponent_sets;
  const currentLanguage = i18n.language?.startsWith("et") ? "et" : "en";
  const opponent = currentLanguage === "et" ? match.opponent : match.opponent_en ?? match.opponent;
  const competition = currentLanguage === "et" ? match.competition : match.competition_en ?? match.competition;
  const city = currentLanguage === "et" ? match.city : match.city_en ?? match.city;
  const typeStyles: Record<string, string> = {
    VM: "bg-green-100 text-green-700",
    AM: "bg-slate-100 text-slate-600",
    MAM: "bg-amber-100 text-amber-700",
    "—": "bg-slate-100 text-slate-500",
  };
  const typeLabels: Record<string, string> = {
    VM: t("common.competitive"),
    AM: t("matches.official_match"),
    MAM: t("common.nonCompetitive"),
    "—": "Unknown",
  };
  const officialSets = match.match_sets
    .filter((s) => s.set_number <= match.estonia_sets + match.opponent_sets)
    .sort((a, b) => a.set_number - b.set_number);
  const officialSetScores = officialSets
    .map((s) => `${s.estonia_points}:${s.opponent_points}`)
    .join(" · ");
  const additionalSets = match.match_sets
    .filter((s) => s.set_number > match.estonia_sets + match.opponent_sets)
    .sort((a, b) => a.set_number - b.set_number);
  const additionalSetScores = additionalSets
    .map((s) => `${s.estonia_points}:${s.opponent_points}`)
    .join(" · ");
  const additionalSetCount = additionalSets.length;
  const additionalSetsLabel = currentLanguage === "et"
    ? t("matches.additional_set", { count: additionalSetCount })
    : `${additionalSetCount} Additional Set${additionalSetCount === 1 ? "" : "s"}`;
  const matchType =
    match.vm ? "VM" :
      match.am ? "AM" :
        match.mam ? "MAM" :
          "—";
  return (
    <div className="p-4 transition-colors hover:bg-slate-50 sm:p-6">
      <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase text-slate-400">
            {competition ?? "—"} • {new Date(match.match_date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            {city ? ` • ${city}` : ""}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-bold sm:text-lg">
            {t("common.estonia")}
            <span className={won ? "text-estonia-blue" : "text-red-700"}>
              {match.estonia_sets} – {match.opponent_sets}
            </span>
            <span className="uppercase break-words">{opponent}</span>
          </div>
        </div>
        <span
          className={`inline-flex w-fit shrink-0 rounded px-2.5 py-1 text-[11px] font-bold ${typeStyles[matchType]}`}
        >
          {typeLabels[matchType]}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
        {officialSetScores && (
          <span className="text-base font-semibold text-slate-800">{officialSetScores}</span>
        )}
        {match.has_additional_sets && additionalSetCount > 0 && (
          <div className="flex flex-col border-l border-slate-200 pl-3">
            <span className="text-base font-semibold text-slate-700">
              <span className="mr-2 text-[11px] font-bold uppercase tracking-[0.08em] text-estonia-blue">{additionalSetsLabel}:</span>
              {additionalSetScores}
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
