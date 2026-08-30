import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { gameHighsOptions, type GameHighRow } from "@/lib/game-highs.queries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslation } from "react-i18next";

const positionOrder = ["SET", "OPP", "OH", "MB", "LIB"];

type GameHighCategory =
  | "pointsPerGame"
  | "plusMinusBest"
  | "plusMinusWorst"
  | "serveTotal"
  | "serveAces"
  | "serveErrorsMost"
  | "serveErrorsLeast"
  | "receptionTotal"
  | "receptionErrors"
  | "receptionPositivePctBest"
  | "receptionPositivePctWorst"
  | "receptionExcellentPctBest"
  | "receptionExcellentPctWorst"
  | "attackTotal"
  | "attackErrors"
  | "attackBlocked"
  | "attackKills"
  | "attackKillPctBest"
  | "attackKillPctWorst"
  | "attackEfficiencyBest"
  | "attackEfficiencyWorst"
  | "blockPoints";

type CategoryRule = {
  minAttemptsField?: "serveTotal" | "receptionTotal" | "attackTotal";
  minAttempts?: number;
  isPercent?: boolean;
  sortDirection?: "asc" | "desc";
};

const categoryRules: Record<GameHighCategory, CategoryRule> = {
  pointsPerGame: { sortDirection: "desc" },
  plusMinusBest: { sortDirection: "desc" },
  plusMinusWorst: { sortDirection: "asc" },
  serveTotal: { sortDirection: "desc" },
  serveAces: { sortDirection: "desc" },
  serveErrorsMost: { sortDirection: "desc" },
  serveErrorsLeast: { minAttemptsField: "serveTotal", minAttempts: 10, sortDirection: "asc" },
  receptionTotal: { sortDirection: "desc" },
  receptionErrors: { sortDirection: "desc" },
  receptionPositivePctBest: { minAttemptsField: "receptionTotal", minAttempts: 10, isPercent: true, sortDirection: "desc" },
  receptionPositivePctWorst: { minAttemptsField: "receptionTotal", minAttempts: 10, isPercent: true, sortDirection: "asc" },
  receptionExcellentPctBest: { minAttemptsField: "receptionTotal", minAttempts: 10, isPercent: true, sortDirection: "desc" },
  receptionExcellentPctWorst: { minAttemptsField: "receptionTotal", minAttempts: 10, isPercent: true, sortDirection: "asc" },
  attackTotal: { sortDirection: "desc" },
  attackErrors: { sortDirection: "desc" },
  attackBlocked: { sortDirection: "desc" },
  attackKills: { sortDirection: "desc" },
  attackKillPctBest: { minAttemptsField: "attackTotal", minAttempts: 10, isPercent: true, sortDirection: "desc" },
  attackKillPctWorst: { minAttemptsField: "attackTotal", minAttempts: 10, isPercent: true, sortDirection: "asc" },
  attackEfficiencyBest: { minAttemptsField: "attackTotal", minAttempts: 10, isPercent: true, sortDirection: "desc" },
  attackEfficiencyWorst: { minAttemptsField: "attackTotal", minAttempts: 10, isPercent: true, sortDirection: "asc" },
  blockPoints: { sortDirection: "desc" },
};

export const Route = createFileRoute("/game-highs")({
  head: () => ({
    meta: [
      { title: "Game Highs — Eesti Võrkpall DB" },
      {
        name: "description",
        content:
          "Individual game highs for Estonia men's national volleyball players, with competitive, official and all-game filters.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(gameHighsOptions()),
  component: GameHighsPage,
  errorComponent: GameHighsError,
});

function GameHighsError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl uppercase italic">Data unavailable</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message || "Could not reach the database."}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-md bg-estonia-dark px-4 py-2 text-sm font-medium text-white hover:bg-estonia-blue"
      >
        Try again
      </button>
    </div>
  );
}

function GameHighsPage() {
  const { t, i18n } = useTranslation();
  const { data } = useSuspenseQuery(gameHighsOptions());
  const [selectedPosition, setSelectedPosition] = useState<string>("ALL");
  const [matchType, setMatchType] = useState<"ALL" | "OFFICIAL" | "COMPETITIVE" | "NON_OFFICIAL">("OFFICIAL");
  const [category, setCategory] = useState<GameHighCategory>("pointsPerGame");
  const [visibleCount, setVisibleCount] = useState<number>(10);

  const positions = useMemo(() => ["ALL", ...positionOrder], []);

  const rows = useMemo(() => {
    const filtered = data.filter((row) => {
      if (selectedPosition !== "ALL" && row.position !== selectedPosition) {
        return false;
      }

      switch (matchType) {
        case "OFFICIAL":
          return row.am === true;
        case "COMPETITIVE":
          return row.vm === true;
        case "NON_OFFICIAL":
          return row.am !== true;
        default:
          return true;
      }
    }).filter((row) => {
      const value = getCategoryValue(row, category);
      if (value == null) {
        return false;
      }

      const rule = categoryRules[category];
      if (rule.minAttemptsField && rule.minAttempts) {
        const attempts = row[rule.minAttemptsField] ?? 0;
        if (attempts < rule.minAttempts) {
          return false;
        }
      }

      return true;
    });

    const ranked = [...filtered].sort((a, b) => {
      const aValue = getCategoryValue(a, category) ?? 0;
      const bValue = getCategoryValue(b, category) ?? 0;
      const direction = categoryRules[category].sortDirection ?? "desc";

      if (aValue !== bValue) {
        return direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      return new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime();
    });

    return ranked;
  }, [data, selectedPosition, matchType, category]);

  useEffect(() => {
    setVisibleCount(10);
  }, [selectedPosition, matchType, category]);

  const categoryLabel = {
    pointsPerGame: t("gameHighs.categories.pointsInMatch"),
    plusMinusBest: t("gameHighs.categories.plusMinusBestInMatch"),
    plusMinusWorst: t("gameHighs.categories.plusMinusWorstInMatch"),
    serveTotal: t("gameHighs.categories.servesInMatch"),
    serveAces: t("gameHighs.categories.acesInMatch"),
    serveErrorsMost: t("gameHighs.categories.serveMistakesMostInMatch"),
    serveErrorsLeast: t("gameHighs.categories.serveMistakesLeastInMatch"),
    receptionTotal: t("gameHighs.categories.receptionsInMatch"),
    receptionErrors: t("gameHighs.categories.receptionMistakesInMatch"),
    receptionPositivePctBest: t("gameHighs.categories.receptionPctBestInMatch"),
    receptionPositivePctWorst: t("gameHighs.categories.receptionPctWorstInMatch"),
    receptionExcellentPctBest: t("gameHighs.categories.receptionIdealPctBestInMatch"),
    receptionExcellentPctWorst: t("gameHighs.categories.receptionIdealPctWorstInMatch"),
    attackTotal: t("gameHighs.categories.attacksInMatch"),
    attackErrors: t("gameHighs.categories.attackOutInMatch"),
    attackBlocked: t("gameHighs.categories.attackBlockedInMatch"),
    attackKills: t("gameHighs.categories.attackSuccessfulInMatch"),
    attackKillPctBest: t("gameHighs.categories.attackPctBestInMatch"),
    attackKillPctWorst: t("gameHighs.categories.attackPctWorstInMatch"),
    attackEfficiencyBest: t("gameHighs.categories.attackEfficiencyBestInMatch"),
    attackEfficiencyWorst: t("gameHighs.categories.attackEfficiencyWorstInMatch"),
    blockPoints: t("gameHighs.categories.blocksInMatch"),
  };

  const categoryDescription = {
    pointsPerGame: t("gameHighs.categoryDescriptions.pointsInMatch"),
    plusMinusBest: t("gameHighs.categoryDescriptions.plusMinusBestInMatch"),
    plusMinusWorst: t("gameHighs.categoryDescriptions.plusMinusWorstInMatch"),
    serveTotal: t("gameHighs.categoryDescriptions.servesInMatch"),
    serveAces: t("gameHighs.categoryDescriptions.acesInMatch"),
    serveErrorsMost: t("gameHighs.categoryDescriptions.serveMistakesMostInMatch"),
    serveErrorsLeast: t("gameHighs.categoryDescriptions.serveMistakesLeastInMatch"),
    receptionTotal: t("gameHighs.categoryDescriptions.receptionsInMatch"),
    receptionErrors: t("gameHighs.categoryDescriptions.receptionMistakesInMatch"),
    receptionPositivePctBest: t("gameHighs.categoryDescriptions.receptionPctBestInMatch"),
    receptionPositivePctWorst: t("gameHighs.categoryDescriptions.receptionPctWorstInMatch"),
    receptionExcellentPctBest: t("gameHighs.categoryDescriptions.receptionIdealPctBestInMatch"),
    receptionExcellentPctWorst: t("gameHighs.categoryDescriptions.receptionIdealPctWorstInMatch"),
    attackTotal: t("gameHighs.categoryDescriptions.attacksInMatch"),
    attackErrors: t("gameHighs.categoryDescriptions.attackOutInMatch"),
    attackBlocked: t("gameHighs.categoryDescriptions.attackBlockedInMatch"),
    attackKills: t("gameHighs.categoryDescriptions.attackSuccessfulInMatch"),
    attackKillPctBest: t("gameHighs.categoryDescriptions.attackPctBestInMatch"),
    attackKillPctWorst: t("gameHighs.categoryDescriptions.attackPctWorstInMatch"),
    attackEfficiencyBest: t("gameHighs.categoryDescriptions.attackEfficiencyBestInMatch"),
    attackEfficiencyWorst: t("gameHighs.categoryDescriptions.attackEfficiencyWorstInMatch"),
    blockPoints: t("gameHighs.categoryDescriptions.blocksInMatch"),
  };

  const categoryHeaderCode: Record<GameHighCategory, string> = {
    pointsPerGame: "PTS",
    plusMinusBest: "WP",
    plusMinusWorst: "WP",
    serveTotal: "Tot",
    serveAces: "Ace",
    serveErrorsMost: "Err",
    serveErrorsLeast: "Err",
    receptionTotal: "Tot",
    receptionErrors: "Err",
    receptionPositivePctBest: "Rec%",
    receptionPositivePctWorst: "Rec%",
    receptionExcellentPctBest: "Id%",
    receptionExcellentPctWorst: "Id%",
    attackTotal: "Tot",
    attackErrors: "Err",
    attackBlocked: "Blk",
    attackKills: "Exc.",
    attackKillPctBest: "Att%",
    attackKillPctWorst: "Att%",
    attackEfficiencyBest: "Eff%",
    attackEfficiencyWorst: "Eff%",
    blockPoints: "BLK",
  };

  const currentLanguage = i18n.language?.toLowerCase() ?? "et";
  const isEstonian = currentLanguage.startsWith("et");

  const categoryGroups: Array<{ title: string; categories: GameHighCategory[] }> = [
    {
      title: t("gameHighs.groups.general"),
      categories: ["pointsPerGame", "plusMinusBest", "plusMinusWorst", "blockPoints"],
    },
    {
      title: t("players.statsGroup.serve"),
      categories: ["serveTotal", "serveAces", "serveErrorsMost", "serveErrorsLeast"],
    },
    {
      title: t("players.statsGroup.reception"),
      categories: [
        "receptionTotal",
        "receptionErrors",
        "receptionPositivePctBest",
        "receptionPositivePctWorst",
        "receptionExcellentPctBest",
        "receptionExcellentPctWorst",
      ],
    },
    {
      title: t("players.statsGroup.attack"),
      categories: [
        "attackTotal",
        "attackErrors",
        "attackBlocked",
        "attackKills",
        "attackKillPctBest",
        "attackKillPctWorst",
        "attackEfficiencyBest",
        "attackEfficiencyWorst",
      ],
    },
  ];

  const activeGroup = categoryGroups.find((group) => group.categories.includes(category));
  const visibleRows = rows.slice(0, visibleCount);

  return (
    <main className="mx-auto w-full max-w-[1400px] px-6 py-10 text-slate-900">
      <div className="mb-6 rounded-2xl bg-estonia-dark p-6 text-white shadow-sm md:p-8">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="text-center">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
              {t("gameHighs.filters.matchType")}
            </div>
            <div className="mx-auto grid w-full max-w-[440px] grid-cols-2 gap-2">
              {[
                { value: "OFFICIAL", label: t("gameHighs.filters.official") },
                { value: "COMPETITIVE", label: t("gameHighs.filters.competitive") },
                { value: "NON_OFFICIAL", label: t("gameHighs.filters.nonCompetitive") },
                { value: "ALL", label: t("gameHighs.filters.all") },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMatchType(option.value as typeof matchType)}
                  className={`w-full rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${matchType === option.value
                    ? "border-estonia-blue bg-estonia-blue text-white"
                    : "border-white/30 bg-white/10 text-white/90 hover:bg-white/20"
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
              {t("gameHighs.filters.position")}
            </div>
            <div className="mx-auto grid w-full max-w-[440px] grid-cols-3 gap-2">
              {positions.map((position) => (
                <button
                  key={position}
                  type="button"
                  onClick={() => setSelectedPosition(position)}
                  className={`w-full rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${selectedPosition === position
                    ? "border-estonia-blue bg-estonia-blue text-white"
                    : "border-white/30 bg-white/10 text-white/90 hover:bg-white/20"
                    }`}
                >
                  {position === "ALL" ? "ALL" : position}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-4">
        {categoryGroups.map((group, index) => {
          const selectedCategory = group.categories.includes(category) ? category : "";
          const isActiveGroup = group.categories.includes(category);
          const tone = [
            "from-sky-50 to-white border-sky-200",
            "from-emerald-50 to-white border-emerald-200",
            "from-amber-50 to-white border-amber-200",
            "from-rose-50 to-white border-rose-200",
          ][index] ?? "from-slate-50 to-white border-slate-200";

          return (
            <section
              key={group.title}
              className={`rounded-xl border bg-gradient-to-br p-4 shadow-sm transition ${tone} ${isActiveGroup ? "ring-2 ring-estonia-blue/40" : ""}`}
            >
              <h2 className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
                {group.title}
              </h2>
              <select
                value={selectedCategory}
                onChange={(event) => setCategory(event.target.value as GameHighCategory)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-estonia-blue"
              >
                <option value="">{t("gameHighs.filters.selectMetric")}</option>
                {group.categories.map((categoryOption) => (
                  <option key={categoryOption} value={categoryOption}>
                    {categoryLabel[categoryOption]}
                  </option>
                ))}
              </select>
            </section>
          );
        })}
      </div>

      {activeGroup && (
        <p className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-6 py-4 text-center text-base font-medium text-estonia-dark md:text-lg">
          {trimTrailingPeriod(categoryDescription[category])}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="min-w-[980px]">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="p-3 text-center">{t("gameHighs.table.rank")}</TableHead>
                <TableHead className="p-3 text-center">{t("gameHighs.table.name")}</TableHead>
                <TableHead className="p-3 text-center">{categoryHeaderCode[category]}</TableHead>
                <TableHead className="p-3 text-center">{t("gameHighs.table.position")}</TableHead>
                <TableHead className="p-3 text-center">{t("gameHighs.table.opponent")}</TableHead>
                <TableHead className="p-3 text-center">{t("gameHighs.table.score")}</TableHead>
                <TableHead className="p-3 text-center">{t("gameHighs.table.date")}</TableHead>
                <TableHead className="p-3 text-center">{t("gameHighs.table.competition")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((row, index) => {
                const resultStyle =
                  Number.parseInt(row.score.split("-")[0] ?? "0", 10) > Number.parseInt(row.score.split("-")[1] ?? "0", 10)
                    ? "text-estonia-blue"
                    : Number.parseInt(row.score.split("-")[0] ?? "0", 10) === Number.parseInt(row.score.split("-")[1] ?? "0", 10)
                      ? "text-green-700"
                      : "text-red-700";
                const opponent = isEstonian ? row.opponent : row.opponentEn ?? row.opponent;

                return (
                  <TableRow key={row.appearanceId}>
                    <TableCell className="p-3 text-center font-medium text-slate-900">{index + 1}</TableCell>
                    <TableCell className="p-3 text-center font-medium text-slate-900">
                      <a href={`/players/${row.playerId}`} className="text-estonia-dark underline-offset-2 hover:text-estonia-blue hover:underline">
                        {row.name}
                      </a>
                    </TableCell>
                    <TableCell className="p-3 text-center font-semibold text-estonia-dark">{formatCategoryValue(getCategoryValue(row, category), category)}</TableCell>
                    <TableCell className="p-3 text-center">{row.position ?? t("positions.Unknown")}</TableCell>
                    <TableCell className="p-3 text-center">{opponent}</TableCell>
                    <TableCell className="p-3 text-center">
                      <a href={`/match/${row.matchId}`} className={`font-semibold hover:underline ${resultStyle}`}>
                        {row.score}
                      </a>
                    </TableCell>
                    <TableCell className="p-3 text-center">{new Date(row.matchDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}</TableCell>
                    <TableCell className="p-3 text-center">{isEstonian ? (row.competition ?? "—") : (row.competitionEn ?? row.competition ?? "—")}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {rows.length > visibleCount && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 10)}
            className="rounded-md border border-estonia-blue bg-white px-5 py-2 text-sm font-semibold text-estonia-blue transition hover:bg-estonia-blue hover:text-white"
          >
            {t("common.loadMore")}
          </button>
        </div>
      )}

      {rows.length === 0 && (
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-12 text-center text-slate-500">
          {t("common.noResults")}
        </div>
      )}
    </main>
  );
}

function getCategoryValue(row: GameHighRow, category: GameHighCategory): number | null {
  switch (category) {
    case "pointsPerGame":
      return row.points;
    case "plusMinusBest":
    case "plusMinusWorst":
      return row.plusMinus;
    case "serveTotal":
      return row.serveTotal;
    case "serveAces":
      return row.serveAces;
    case "serveErrorsMost":
    case "serveErrorsLeast":
      return row.serveErrors;
    case "receptionTotal":
      return row.receptionTotal;
    case "receptionErrors":
      return row.receptionErrors;
    case "receptionPositivePctBest":
    case "receptionPositivePctWorst":
      return row.receptionPositivePct;
    case "receptionExcellentPctBest":
    case "receptionExcellentPctWorst":
      return row.receptionExcellentPct;
    case "attackTotal":
      return row.attackTotal;
    case "attackErrors":
      return row.attackErrors;
    case "attackBlocked":
      return row.attackBlocked;
    case "attackKills":
      return row.attackKills;
    case "attackKillPctBest":
    case "attackKillPctWorst":
      return row.attackKillPct;
    case "attackEfficiencyBest":
    case "attackEfficiencyWorst":
      return row.attackEfficiency;
    case "blockPoints":
      return row.blockPoints;
    default:
      return null;
  }
}

function trimTrailingPeriod(text: string): string {
  return text.trim().replace(/[.!?]$/, "");
}

function formatCategoryValue(value: number | null, category: GameHighCategory): string {
  if (value == null) {
    return "—";
  }

  if (categoryRules[category].isPercent) {
    return `${value.toFixed(1)}%`;
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

