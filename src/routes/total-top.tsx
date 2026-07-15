import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { totalTopOptions, type TotalTopRow, type PlayerTotals } from "@/lib/total-top.queries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslation } from "react-i18next";

const positionOrder = ["SET", "OPP", "OH", "MB", "LIB"];

export const Route = createFileRoute("/total-top")({
  head: () => ({
    meta: [
      { title: "Total TOP — Eesti Võrkpall DB" },
      {
        name: "description",
        content:
          "Leaderboards for total career match statistics by position, separated across competitive, official, and all matches.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(totalTopOptions()),
  component: TotalTopPage,
  errorComponent: TotalTopError,
});

function TotalTopError({ error, reset }: { error: Error; reset: () => void }) {
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

type TotalTopStatKey =
  | "points"
  | "appearances"
  | "games"
  | "sets"
  | "bench"
  | "pointsPerGame"
  | "efficiencyTop"
  | "efficiencyBottom";

function TotalTopPage() {
  const { t } = useTranslation();
  const { data } = useSuspenseQuery(totalTopOptions());
  const [selectedPosition, setSelectedPosition] = useState<string>("ALL");
  const [selectedStat, setSelectedStat] = useState<TotalTopStatKey>("points");
  const [sortColumn, setSortColumn] = useState<"official" | "competitive" | "all">("official");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const positions = useMemo(() => ["ALL", ...positionOrder], []);
  const statOptions: Array<{ value: TotalTopStatKey; label: string }> = useMemo(
    () => [
      { value: "points", label: t("totalTop.table.points") },
      { value: "appearances", label: t("totalTop.table.appearances") },
      { value: "games", label: t("totalTop.table.games") },
      { value: "sets", label: t("totalTop.table.sets") },
      { value: "bench", label: t("totalTop.table.bench") },
      { value: "pointsPerGame", label: t("totalTop.table.pointsPerGame") },
      { value: "efficiencyTop", label: t("totalTop.table.efficiencyTop") },
      { value: "efficiencyBottom", label: t("totalTop.table.efficiencyBottom") },
    ],
    [t]
  );

  function getStatValue(group: PlayerTotals, stat: TotalTopStatKey) {
    switch (stat) {
      case "pointsPerGame":
        return group.pointsPerGame;
      case "efficiencyTop":
        return group.efficiencyTop;
      case "efficiencyBottom":
        return group.efficiencyBottom;
      default:
        return group[stat];
    }
  }

  function getPerGameValue(group: PlayerTotals, stat: TotalTopStatKey) {
    if (group.games <= 0) {
      return null;
    }

    if (stat === "pointsPerGame") {
      return group.pointsPerGame;
    }

    if (stat === "efficiencyTop" || stat === "efficiencyBottom") {
      return getStatValue(group, stat);
    }

    const total = getStatValue(group, stat);
    return total == null ? null : Number((total / group.games).toFixed(2));
  }

  function formatStatValue(value: number | null | undefined) {
    if (value == null) {
      return "—";
    }
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  const filteredRows = useMemo(() => {
    return data.filter((row) => selectedPosition === "ALL" || row.position === selectedPosition);
  }, [data, selectedPosition]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const aValue = (a[sortColumn][selectedStat] ?? 0) as number;
      const bValue = (b[sortColumn][selectedStat] ?? 0) as number;
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });
  }, [filteredRows, selectedStat, sortColumn, sortDirection]);

  function handleSort(column: "official" | "competitive" | "all") {
    if (sortColumn === column) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
      return;
    }

    setSortColumn(column);
    setSortDirection("desc");
  }

  const statLabel = statOptions.find((option) => option.value === selectedStat)?.label ?? "";

  return (
    <div className="text-slate-900">
      <header className="bg-estonia-dark px-6 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <h1 className="mt-2 font-display text-4xl uppercase italic md:text-5xl">
            {t("totalTop.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70">
            {t("totalTop.subtitle")}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-300">
                {t("totalTop.selectStat")}
              </label>
              <select
                value={selectedStat}
                onChange={(event) => setSelectedStat(event.target.value as TotalTopStatKey)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-estonia-blue"
              >
                {statOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="ml-auto flex flex-wrap gap-2">
              {positions.map((position) => (
                <button
                  key={position}
                  type="button"
                  onClick={() => setSelectedPosition(position)}
                  className={`rounded-md border px-3 py-2 text-sm transition-colors ${selectedPosition === position
                    ? "border-estonia-blue bg-estonia-blue text-white"
                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {position === "ALL" ? t("totalTop.positions.all") : t(`positions.${position}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-100">
            <div className="font-semibold uppercase tracking-[0.24em] text-estonia-blue">
              {t("totalTop.currentStat")}:
            </div>
            <div className="mt-2 text-2xl font-display text-white">{statLabel}</div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-6 py-10">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table className="min-w-full">
            <TableHeader>
            <TableRow className="bg-slate-100">
              <TableHead rowSpan={2} className="p-3 text-center align-middle">
                {t("totalTop.table.rank")}
              </TableHead>
              <TableHead rowSpan={2} className="p-3 text-left align-middle">
                {t("totalTop.table.name")}
              </TableHead>
              <TableHead rowSpan={2} className="p-3 text-center align-middle">
                {t("totalTop.table.position")}
              </TableHead>
              <TableHead colSpan={3} className="p-3 text-center text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {t("totalTop.table.totals")}
              </TableHead>
              <TableHead colSpan={3} className="p-3 text-center text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {t("totalTop.table.perGame")}
              </TableHead>
            </TableRow>
            <TableRow className="bg-slate-50">
              {(["official", "competitive", "all"] as const).map((column) => (
                <TableHead key={column} className={`p-3 text-center ${sortColumn === column ? "bg-estonia-blue/5 text-estonia-dark" : "text-slate-700"}`}>
                  <button
                    type="button"
                    onClick={() => handleSort(column)}
                    className="inline-flex w-full items-center justify-center gap-2 text-left text-sm font-semibold uppercase tracking-[0.24em]"
                  >
                    {t(`common.${column === "official" ? "official" : column === "competitive" ? "competitive" : "allMatches"}`)}
                    <span>{sortColumn === column ? (sortDirection === "asc" ? "↑" : "↓") : "⇅"}</span>
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
            <TableBody>
              {sortedRows.map((row, index) => (
                <TableRow key={row.playerId}>
                  <TableCell className="p-3 text-center font-medium text-slate-900">{index + 1}</TableCell>
                  <TableCell className="p-3 text-left font-medium text-slate-900">{row.name}</TableCell>
                  <TableCell className="p-3 text-center">{row.position ?? t("positions.Unknown")}</TableCell>

                  <TableCell className={`p-3 text-center font-semibold text-estonia-dark ${sortColumn === "official" ? "bg-estonia-blue/5" : "bg-white"}`}>
                    {formatStatValue(getStatValue(row.official, selectedStat))}
                  </TableCell>

                  <TableCell className={`p-3 text-center font-semibold text-estonia-dark ${sortColumn === "competitive" ? "bg-estonia-blue/5" : "bg-white"}`}>
                    {formatStatValue(getStatValue(row.competitive, selectedStat))}
                  </TableCell>

                  <TableCell className={`p-3 text-center font-semibold text-estonia-dark ${sortColumn === "all" ? "bg-estonia-blue/5" : "bg-white"}`}>
                    {formatStatValue(getStatValue(row.all, selectedStat))}
                  </TableCell>

                  <TableCell className="p-3 text-center text-slate-600">
                    {formatStatValue(getPerGameValue(row.official, selectedStat))}
                  </TableCell>

                  <TableCell className="p-3 text-center text-slate-600">
                    {formatStatValue(getPerGameValue(row.competitive, selectedStat))}
                  </TableCell>

                  <TableCell className="p-3 text-center text-slate-600">
                    {formatStatValue(getPerGameValue(row.all, selectedStat))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
