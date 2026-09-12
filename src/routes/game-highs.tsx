import { useSuspenseQuery } from "@tanstack/react-query";
import { Fragment, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { gameHighsOptions, type GameHighRow } from "@/lib/game-highs.queries";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import MultiSelect from "@/components/ui/multi-select";
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
  receptionPositivePctBest: {
    minAttemptsField: "receptionTotal",
    minAttempts: 10,
    isPercent: true,
    sortDirection: "desc",
  },
  receptionPositivePctWorst: {
    minAttemptsField: "receptionTotal",
    minAttempts: 10,
    isPercent: true,
    sortDirection: "asc",
  },
  receptionExcellentPctBest: {
    minAttemptsField: "receptionTotal",
    minAttempts: 10,
    isPercent: true,
    sortDirection: "desc",
  },
  receptionExcellentPctWorst: {
    minAttemptsField: "receptionTotal",
    minAttempts: 10,
    isPercent: true,
    sortDirection: "asc",
  },
  attackTotal: { sortDirection: "desc" },
  attackErrors: { sortDirection: "desc" },
  attackBlocked: { sortDirection: "desc" },
  attackKills: { sortDirection: "desc" },
  attackKillPctBest: {
    minAttemptsField: "attackTotal",
    minAttempts: 10,
    isPercent: true,
    sortDirection: "desc",
  },
  attackKillPctWorst: {
    minAttemptsField: "attackTotal",
    minAttempts: 10,
    isPercent: true,
    sortDirection: "asc",
  },
  attackEfficiencyBest: {
    minAttemptsField: "attackTotal",
    minAttempts: 10,
    isPercent: true,
    sortDirection: "desc",
  },
  attackEfficiencyWorst: {
    minAttemptsField: "attackTotal",
    minAttempts: 10,
    isPercent: true,
    sortDirection: "asc",
  },
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
  const [matchType, setMatchType] = useState<"ALL" | "OFFICIAL" | "COMPETITIVE" | "NON_OFFICIAL">(
    "OFFICIAL",
  );
  const [selectedYear, setSelectedYear] = useState<string[]>(["all"]);
  const [selectedCompetition, setSelectedCompetition] = useState<string[]>(["all"]);
  const [selectedOpponent, setSelectedOpponent] = useState<string[]>(["all"]);
  const [category, setCategory] = useState<GameHighCategory>("pointsPerGame");
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [expandedTeamMetric, setExpandedTeamMetric] = useState<string | null>(null);

  const positions = useMemo(() => ["ALL", ...positionOrder], []);
  const currentLanguage = i18n.language?.toLowerCase() ?? "et";
  const isEstonian = currentLanguage.startsWith("et");

  const getLocalizedOpponent = (row: GameHighRow) =>
    isEstonian ? row.opponent : (row.opponentEn ?? row.opponent);

  const getLocalizedCompetition = (row: GameHighRow) =>
    isEstonian ? row.competition : (row.competitionEn ?? row.competition);

  const matchTypeFilteredRows = useMemo(() => {
    return data.filter((row) => {
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
    });
  }, [data, selectedPosition, matchType]);

  const yearOptions = useMemo(() => {
    const values = new Set<string>();

    matchTypeFilteredRows.forEach((row) => {
      const localizedCompetition = getLocalizedCompetition(row);
      const localizedOpponent = getLocalizedOpponent(row);

      if (
        !selectedCompetition.includes("all") &&
        localizedCompetition &&
        !selectedCompetition.includes(localizedCompetition)
      )
        return;
      if (
        !selectedOpponent.includes("all") &&
        localizedOpponent &&
        !selectedOpponent.includes(localizedOpponent)
      )
        return;

      values.add(new Date(row.matchDate).getFullYear().toString());
    });

    return [...values].sort();
  }, [matchTypeFilteredRows, selectedCompetition, selectedOpponent, currentLanguage]);

  const competitionOptions = useMemo(() => {
    const values = new Set<string>();

    matchTypeFilteredRows.forEach((row) => {
      const localizedCompetition = getLocalizedCompetition(row);
      const localizedOpponent = getLocalizedOpponent(row);

      if (!selectedYear.includes("all")) {
        const year = new Date(row.matchDate).getFullYear().toString();
        if (!selectedYear.includes(year)) return;
      }
      if (
        !selectedOpponent.includes("all") &&
        localizedOpponent &&
        !selectedOpponent.includes(localizedOpponent)
      )
        return;

      if (localizedCompetition) values.add(localizedCompetition);
    });

    return [...values].sort();
  }, [matchTypeFilteredRows, selectedYear, selectedOpponent, currentLanguage]);

  const opponentOptions = useMemo(() => {
    const values = new Set<string>();

    matchTypeFilteredRows.forEach((row) => {
      const localizedCompetition = getLocalizedCompetition(row);
      const localizedOpponent = getLocalizedOpponent(row);

      if (!selectedYear.includes("all")) {
        const year = new Date(row.matchDate).getFullYear().toString();
        if (!selectedYear.includes(year)) return;
      }
      if (
        !selectedCompetition.includes("all") &&
        localizedCompetition &&
        !selectedCompetition.includes(localizedCompetition)
      )
        return;

      if (localizedOpponent) values.add(localizedOpponent);
    });

    return [...values].sort();
  }, [matchTypeFilteredRows, selectedYear, selectedCompetition, currentLanguage]);

  const rows = useMemo(() => {
    const filtered = matchTypeFilteredRows.filter((row) => {
      const localizedCompetition = getLocalizedCompetition(row);
      const localizedOpponent = getLocalizedOpponent(row);

      if (!selectedYear.includes("all") && selectedYear.length > 0) {
        const year = new Date(row.matchDate).getFullYear().toString();
        if (!selectedYear.includes(year)) return false;
      }

      if (!selectedCompetition.includes("all") && selectedCompetition.length > 0) {
        if (!localizedCompetition || !selectedCompetition.includes(localizedCompetition))
          return false;
      }

      if (!selectedOpponent.includes("all") && selectedOpponent.length > 0) {
        if (!localizedOpponent || !selectedOpponent.includes(localizedOpponent)) return false;
      }

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
  }, [
    matchTypeFilteredRows,
    selectedYear,
    selectedCompetition,
    selectedOpponent,
    category,
    currentLanguage,
  ]);

  useEffect(() => {
    setVisibleCount(10);
  }, [selectedPosition, matchType, selectedYear, selectedCompetition, selectedOpponent, category]);

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

  const teamFilteredRows = useMemo(() => {
    return data
      .filter((row) => {
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
      })
      .filter((row) => {
        const localizedCompetition = getLocalizedCompetition(row);
        const localizedOpponent = getLocalizedOpponent(row);

        if (!selectedYear.includes("all") && selectedYear.length > 0) {
          const year = new Date(row.matchDate).getFullYear().toString();
          if (!selectedYear.includes(year)) return false;
        }

        if (!selectedCompetition.includes("all") && selectedCompetition.length > 0) {
          if (!localizedCompetition || !selectedCompetition.includes(localizedCompetition))
            return false;
        }

        if (!selectedOpponent.includes("all") && selectedOpponent.length > 0) {
          if (!localizedOpponent || !selectedOpponent.includes(localizedOpponent)) return false;
        }

        return true;
      });
  }, [data, matchType, selectedYear, selectedCompetition, selectedOpponent, currentLanguage]);

  const teamGameHighRows = useMemo(() => {
    type TeamMatchTotals = {
      matchId: number;
      matchDate: string;
      opponent: string;
      opponentEn: string | null;
      competition: string | null;
      competitionEn: string | null;
      score: string;
      am: boolean | null;
      mam: boolean | null;
      maxEstoniaSetPoints: number | null;
      points: number;
      breakPoints: number;
      plusMinus: number;
      serveTotal: number;
      serveAces: number;
      serveErrors: number;
      receptionTotal: number;
      receptionErrors: number;
      receptionPositiveCount: number;
      receptionExcellentCount: number;
      attackTotal: number;
      attackErrors: number;
      attackBlocked: number;
      attackKills: number;
      blockPoints: number;
    };

    const teamByMatch = new Map<number, TeamMatchTotals>();

    teamFilteredRows.forEach((row) => {
      const current = teamByMatch.get(row.matchId) ?? {
        matchId: row.matchId,
        matchDate: row.matchDate,
        opponent: row.opponent,
        opponentEn: row.opponentEn,
        competition: row.competition,
        competitionEn: row.competitionEn,
        score: row.score,
        am: row.am,
        mam: row.mam,
        maxEstoniaSetPoints: row.maxEstoniaSetPoints,
        points: 0,
        breakPoints: 0,
        plusMinus: 0,
        serveTotal: 0,
        serveAces: 0,
        serveErrors: 0,
        receptionTotal: 0,
        receptionErrors: 0,
        receptionPositiveCount: 0,
        receptionExcellentCount: 0,
        attackTotal: 0,
        attackErrors: 0,
        attackBlocked: 0,
        attackKills: 0,
        blockPoints: 0,
      };

      current.points += row.points ?? 0;
      current.breakPoints += row.breakPoints ?? 0;
      current.plusMinus += row.plusMinus ?? 0;
      current.serveTotal += row.serveTotal ?? 0;
      current.serveAces += row.serveAces ?? 0;
      current.serveErrors += row.serveErrors ?? 0;
      current.receptionTotal += row.receptionTotal ?? 0;
      current.receptionErrors += row.receptionErrors ?? 0;
      current.attackTotal += row.attackTotal ?? 0;
      current.attackErrors += row.attackErrors ?? 0;
      current.attackBlocked += row.attackBlocked ?? 0;
      current.attackKills += row.attackKills ?? 0;
      current.blockPoints += row.blockPoints ?? 0;

      if (
        row.maxEstoniaSetPoints != null &&
        (current.maxEstoniaSetPoints == null ||
          row.maxEstoniaSetPoints > current.maxEstoniaSetPoints)
      ) {
        current.maxEstoniaSetPoints = row.maxEstoniaSetPoints;
      }

      if ((row.receptionTotal ?? 0) > 0 && row.receptionPositivePct != null) {
        current.receptionPositiveCount +=
          (row.receptionTotal ?? 0) * (row.receptionPositivePct / 100);
      }

      if ((row.receptionTotal ?? 0) > 0 && row.receptionExcellentPct != null) {
        current.receptionExcellentCount +=
          (row.receptionTotal ?? 0) * (row.receptionExcellentPct / 100);
      }

      teamByMatch.set(row.matchId, current);
    });

    const teamMatches = Array.from(teamByMatch.values()).map((match) => {
      const receptionPositivePct =
        match.receptionTotal > 0
          ? (match.receptionPositiveCount / match.receptionTotal) * 100
          : null;
      const receptionExcellentPct =
        match.receptionTotal > 0
          ? (match.receptionExcellentCount / match.receptionTotal) * 100
          : null;
      const attackKillPct =
        match.attackTotal > 0 ? (match.attackKills / match.attackTotal) * 100 : null;
      const attackEfficiency =
        match.attackTotal > 0
          ? ((match.attackKills - match.attackBlocked - match.attackErrors) / match.attackTotal) *
          100
          : null;

      return {
        ...match,
        receptionPositivePct,
        receptionExcellentPct,
        attackKillPct,
        attackEfficiency,
      };
    });

    const metrics = [
      { key: "points", label: t("players.statsField.points") },
      {
        key: "maxEstoniaSetPoints",
        label: isEstonian ? "Kõige rohkem punkte geimis" : "Most points in a set",
      },
      { key: "breakPoints", label: t("players.statsField.breakPoints") },
      { key: "plusMinus", label: t("players.statsField.plusMinus") },
      { key: "serveTotal", label: t("players.statsField.serveTotal") },
      { key: "serveAces", label: t("players.statsField.serveAces") },
      { key: "serveErrors", label: t("players.statsField.serveErrors") },
      {
        key: "bestAceErrorRatio",
        label: isEstonian ? "Parim ässa/vea suhe" : "Best Ace/Error Ratio",
      },
      { key: "receptionTotal", label: t("players.statsField.receptionTotal") },
      { key: "receptionErrors", label: t("players.statsField.receptionErrors") },
      { key: "receptionPositivePct", label: t("players.statsField.receptionPositivePct") },
      { key: "receptionExcellentPct", label: t("players.statsField.receptionExcellentPct") },
      { key: "attackTotal", label: t("players.statsField.attackTotal") },
      { key: "attackErrors", label: t("players.statsField.attackErrors") },
      { key: "attackBlocked", label: t("players.statsField.attackBlocked") },
      { key: "attackKills", label: t("players.statsField.attackKills") },
      { key: "attackKillPct", label: t("players.statsField.attackKillPct") },
      { key: "attackEfficiency", label: t("players.statsField.attackEfficiency") },
      { key: "blockPoints", label: t("players.statsField.blockPoints") },
    ] as const;

    const formatTeamValue = (value: number | null, key: string) => {
      if (value == null) return "—";

      if (
        key === "receptionPositivePct" ||
        key === "receptionExcellentPct" ||
        key === "attackKillPct" ||
        key === "attackEfficiency"
      ) {
        return `${value.toFixed(1)}%`;
      }

      return Number.isInteger(value) ? String(value) : value.toFixed(2);
    };

    return metrics.map((metric) => {
      const ranked = [...teamMatches]
        .filter((match) => {
          if (metric.key === "bestAceErrorRatio") {
            return match.serveAces > 0;
          }

          const value = match[metric.key as keyof typeof match] as number | null | undefined;
          return value != null;
        })
        .sort((left, right) => {
          if (metric.key === "bestAceErrorRatio") {
            const leftRatio = left.serveErrors / left.serveAces;
            const rightRatio = right.serveErrors / right.serveAces;

            if (leftRatio !== rightRatio) {
              return leftRatio - rightRatio;
            }

            return new Date(right.matchDate).getTime() - new Date(left.matchDate).getTime();
          }

          const leftValue = left[metric.key as keyof typeof left] as number | null | undefined;
          const rightValue = right[metric.key as keyof typeof right] as number | null | undefined;

          if ((leftValue ?? 0) !== (rightValue ?? 0)) {
            return (rightValue ?? 0) - (leftValue ?? 0);
          }

          return new Date(right.matchDate).getTime() - new Date(left.matchDate).getTime();
        });

      const best = ranked[0] ?? null;

      return {
        key: metric.key,
        metric: metric.label,
        value:
          metric.key === "bestAceErrorRatio"
            ? best
              ? `${best.serveAces} - ${best.serveErrors}`
              : "—"
            : formatTeamValue(
              best ? ((best[metric.key as keyof typeof best] as number | null) ?? null) : null,
              metric.key,
            ),
        opponent: best ? (isEstonian ? best.opponent : (best.opponentEn ?? best.opponent)) : "—",
        score: best?.score ?? "—",
        date: best
          ? new Date(best.matchDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
          : "—",
        competition: best
          ? isEstonian
            ? (best.competition ?? "—")
            : (best.competitionEn ?? best.competition ?? "—")
          : "—",
        matchHref: best
          ? best.mam === true
            ? `/match/${best.matchId}/all`
            : `/match/${best.matchId}`
          : null,
        topTen: ranked.slice(0, 10).map((match) => ({
          value:
            metric.key === "bestAceErrorRatio"
              ? `${match.serveAces} - ${match.serveErrors}`
              : formatTeamValue(
                (match[metric.key as keyof typeof match] as number | null) ?? null,
                metric.key,
              ),
          opponent: isEstonian ? match.opponent : (match.opponentEn ?? match.opponent),
          score: match.score,
          date: new Date(match.matchDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          competition: isEstonian
            ? (match.competition ?? "—")
            : (match.competitionEn ?? match.competition ?? "—"),
          matchHref: match.mam === true ? `/match/${match.matchId}/all` : `/match/${match.matchId}`,
        })),
      };
    });
  }, [teamFilteredRows, t, isEstonian]);

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

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <div>
            <span className="sr-only">{t("players.statsFilter.year")}</span>
            <MultiSelect
              options={yearOptions.map((y) => ({ value: y, label: y }))}
              value={selectedYear}
              onChange={(v) =>
                setSelectedYear(v.length === 0 ? ["all"] : v.includes("all") ? ["all"] : v)
              }
              placeholder={t("players.statsFilter.allYears")}
              className="w-full"
            />
          </div>

          <div>
            <span className="sr-only">{t("players.statsFilter.competition")}</span>
            <MultiSelect
              options={competitionOptions.map((c) => ({ value: c, label: c }))}
              value={selectedCompetition}
              onChange={(v) =>
                setSelectedCompetition(v.length === 0 ? ["all"] : v.includes("all") ? ["all"] : v)
              }
              placeholder={t("players.statsFilter.allCompetitions")}
              className="w-full"
            />
          </div>

          <div>
            <span className="sr-only">{t("players.statsFilter.opponent")}</span>
            <MultiSelect
              options={opponentOptions.map((o) => ({ value: o, label: o }))}
              value={selectedOpponent}
              onChange={(v) =>
                setSelectedOpponent(v.length === 0 ? ["all"] : v.includes("all") ? ["all"] : v)
              }
              placeholder={t("players.statsFilter.allOpponents")}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-4">
        {categoryGroups.map((group, index) => {
          const selectedCategory = group.categories.includes(category) ? category : "";
          const isActiveGroup = group.categories.includes(category);
          const tone =
            [
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
                <TableHead className="p-3 text-center">
                  {t("gameHighs.table.competition")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((row, index) => {
                const resultStyle =
                  Number.parseInt(row.score.split("-")[0] ?? "0", 10) >
                    Number.parseInt(row.score.split("-")[1] ?? "0", 10)
                    ? "text-estonia-blue"
                    : Number.parseInt(row.score.split("-")[0] ?? "0", 10) ===
                      Number.parseInt(row.score.split("-")[1] ?? "0", 10)
                      ? "text-green-700"
                      : "text-red-700";
                const opponent = isEstonian ? row.opponent : (row.opponentEn ?? row.opponent);

                return (
                  <TableRow key={row.appearanceId}>
                    <TableCell className="p-3 text-center font-medium text-slate-900">
                      {index + 1}
                    </TableCell>
                    <TableCell className="p-3 text-center font-medium text-slate-900">
                      <a
                        href={`/players/${row.playerId}`}
                        className="text-estonia-dark underline-offset-2 hover:text-estonia-blue hover:underline"
                      >
                        {row.name}
                      </a>
                    </TableCell>
                    <TableCell className="p-3 text-center font-semibold text-estonia-dark">
                      {formatCategoryValue(getCategoryValue(row, category), category)}
                    </TableCell>
                    <TableCell className="p-3 text-center">
                      {row.position ?? t("positions.Unknown")}
                    </TableCell>
                    <TableCell className="p-3 text-center">{opponent}</TableCell>
                    <TableCell className="p-3 text-center">
                      <a
                        href={`/match/${row.matchId}`}
                        className={`font-semibold hover:underline ${resultStyle}`}
                      >
                        {row.score}
                      </a>
                    </TableCell>
                    <TableCell className="p-3 text-center">
                      {new Date(row.matchDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="p-3 text-center">
                      {isEstonian
                        ? (row.competition ?? "—")
                        : (row.competitionEn ?? row.competition ?? "—")}
                    </TableCell>
                  </TableRow>
                );
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

      <section className="mt-10">
        <h2 className="mb-4 font-display text-2xl uppercase italic text-estonia-dark">
          {isEstonian ? "Koondise Ühe mängu parimad" : "National Team Game Highs"}
        </h2>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="min-w-[980px]">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="p-3 text-left">{t("players.statsField.stat")}</TableHead>
                  <TableHead className="p-3 text-center">{t("gameHighs.table.value")}</TableHead>
                  <TableHead className="p-3 text-left">{t("gameHighs.table.opponent")}</TableHead>
                  <TableHead className="p-3 text-center">{t("gameHighs.table.score")}</TableHead>
                  <TableHead className="p-3 text-center">{t("gameHighs.table.date")}</TableHead>
                  <TableHead className="p-3 text-left">
                    {t("gameHighs.table.competition")}
                  </TableHead>
                  <TableHead className="p-3 text-center">Top 10</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamGameHighRows.map((row) => (
                  <Fragment key={row.key}>
                    <TableRow>
                      <TableCell className="p-3 text-sm text-slate-700">{row.metric}</TableCell>
                      <TableCell className="p-3 text-center font-semibold text-estonia-dark">
                        {row.value}
                      </TableCell>
                      <TableCell className="p-3 text-sm text-slate-700">{row.opponent}</TableCell>
                      <TableCell className="p-3 text-center">
                        {row.matchHref
                          ? (() => {
                            const parts = row.score.split("-");
                            const estonia = Number.parseInt(parts[0] ?? "0", 10);
                            const opponent = Number.parseInt(parts[1] ?? "0", 10);
                            const resultStyle =
                              estonia > opponent
                                ? "text-estonia-blue"
                                : estonia === opponent
                                  ? "text-green-700"
                                  : "text-red-700";

                            return (
                              <a
                                href={row.matchHref}
                                className={`font-semibold hover:underline ${resultStyle}`}
                              >
                                {row.score}
                              </a>
                            );
                          })()
                          : "—"}
                      </TableCell>
                      <TableCell className="p-3 text-center text-sm text-slate-700">
                        {row.date}
                      </TableCell>
                      <TableCell className="p-3 text-sm text-slate-700">
                        {row.competition}
                      </TableCell>
                      <TableCell className="p-3 text-center">
                        {row.topTen.length > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedTeamMetric((current) =>
                                current === row.key ? null : row.key,
                              )
                            }
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-700 transition hover:border-estonia-blue hover:text-estonia-blue"
                            aria-label={
                              isEstonian
                                ? "Ava või peida selle kategooria TOP 10"
                                : "Toggle top 10 for this category"
                            }
                            title={
                              isEstonian
                                ? "Ava või peida selle kategooria TOP 10"
                                : "Toggle top 10 for this category"
                            }
                          >
                            {expandedTeamMetric === row.key ? "▴" : "▾"}
                          </button>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </TableCell>
                    </TableRow>

                    {expandedTeamMetric === row.key && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-slate-50/60 p-3">
                          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                            <table className="min-w-[760px] w-full border-collapse">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                    #
                                  </th>
                                  <th className="px-2 py-2 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                    {t("gameHighs.table.value")}
                                  </th>
                                  <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                    {t("gameHighs.table.opponent")}
                                  </th>
                                  <th className="px-2 py-2 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                    {t("gameHighs.table.score")}
                                  </th>
                                  <th className="px-2 py-2 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                    {t("gameHighs.table.date")}
                                  </th>
                                  <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                    {t("gameHighs.table.competition")}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {row.topTen.map((item, index) => {
                                  const parts = item.score.split("-");
                                  const estonia = Number.parseInt(parts[0] ?? "0", 10);
                                  const opponent = Number.parseInt(parts[1] ?? "0", 10);
                                  const resultStyle =
                                    estonia > opponent
                                      ? "text-estonia-blue"
                                      : estonia === opponent
                                        ? "text-green-700"
                                        : "text-red-700";

                                  return (
                                    <tr
                                      key={`${row.key}-${index}`}
                                      className="border-t border-slate-100"
                                    >
                                      <td className="px-2 py-2 text-sm text-slate-600">
                                        {index + 1}
                                      </td>
                                      <td className="px-2 py-2 text-center text-sm font-semibold text-estonia-dark">
                                        {item.value}
                                      </td>
                                      <td className="px-2 py-2 text-sm text-slate-700">
                                        {item.opponent}
                                      </td>
                                      <td className="px-2 py-2 text-center text-sm">
                                        <a
                                          href={item.matchHref}
                                          className={`font-semibold hover:underline ${resultStyle}`}
                                        >
                                          {item.score}
                                        </a>
                                      </td>
                                      <td className="px-2 py-2 text-center text-sm text-slate-700">
                                        {item.date}
                                      </td>
                                      <td className="px-2 py-2 text-sm text-slate-700">
                                        {item.competition}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
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
