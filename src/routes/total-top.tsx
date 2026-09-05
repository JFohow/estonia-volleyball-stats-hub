import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { totalTopOptions, type PlayerTotals } from "@/lib/total-top.queries";
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

type MatchGroupKey = "official" | "competitive" | "nonOfficial" | "all";
type SortMode = "perGame" | "total";

function TotalTopPage() {
  const { t } = useTranslation();
  const { data } = useSuspenseQuery(totalTopOptions());
  const [selectedPosition, setSelectedPosition] = useState<string>("ALL");
  const [selectedStat, setSelectedStat] = useState<TotalTopStatKey>("points");
  const [displayMode, setDisplayMode] = useState<SortMode>("total");
  const [sortGroup, setSortGroup] = useState<MatchGroupKey>("official");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const positions = useMemo(() => ["ALL", ...positionOrder], []);
  const statOptions: Array<{ value: TotalTopStatKey; label: string }> = useMemo(
    () => [
      { value: "appearances", label: t("totalTop.metrics.mostAppearances") },
      { value: "sets", label: t("totalTop.metrics.mostSets") },
      { value: "points", label: t("totalTop.metrics.mostPoints") },
      { value: "breakPoints", label: t("totalTop.metrics.mostBreakPoints") },
      { value: "plusMinus", label: t("totalTop.metrics.bestPlusMinus") },
      { value: "serveTotal", label: t("totalTop.metrics.mostServes") },
      { value: "serveAces", label: t("totalTop.metrics.mostServeAces") },
      { value: "serveErrors", label: t("totalTop.metrics.mostServeErrors") },
      { value: "receptionTotal", label: t("totalTop.metrics.mostReceptions") },
      { value: "receptionErrors", label: t("totalTop.metrics.mostReceptionErrors") },
      { value: "receptionPositivePct", label: t("totalTop.metrics.bestReceptionPct") },
      { value: "receptionExcellentPct", label: t("totalTop.metrics.bestIdealReceptionPct") },
      { value: "attackTotal", label: t("totalTop.metrics.mostAttacks") },
      { value: "attackErrors", label: t("totalTop.metrics.mostAttackErrors") },
      { value: "attackBlocked", label: t("totalTop.metrics.mostAttackBlocks") },
      { value: "attackKills", label: t("totalTop.metrics.mostSuccessfulAttack") },
      { value: "attackKillPct", label: t("totalTop.metrics.bestAttackPct") },
      { value: "attackEfficiency", label: t("totalTop.metrics.bestAttackEffPct") },
      { value: "blockPoints", label: t("totalTop.metrics.mostBlockPoints") },
    ],
    [t]
  );

  function getStatValue(group: PlayerTotals, stat: TotalTopStatKey) {
    return group[stat];
  }

  function getPerGameValue(group: PlayerTotals, stat: TotalTopStatKey) {
    if (
      stat === "attackKillPct" ||
      stat === "attackEfficiency" ||
      stat === "receptionPositivePct" ||
      stat === "receptionExcellentPct"
    ) {
      const total = getStatValue(group, stat);
      return total == null ? null : Number(total.toFixed(2));
    }

    if (group.games <= 0) {
      return null;
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

  function getValueForGroup(row: (typeof data)[number], groupKey: MatchGroupKey) {
    const group = row[groupKey];
    return displayMode === "perGame"
      ? getPerGameValue(group, selectedStat)
      : getStatValue(group, selectedStat);
  }

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const aValue = getValueForGroup(a, sortGroup) ?? 0;
      const bValue = getValueForGroup(b, sortGroup) ?? 0;

      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });
  }, [filteredRows, selectedStat, displayMode, sortGroup, sortDirection]);

  function handleSortByGroup(group: MatchGroupKey) {
    if (sortGroup === group) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
      return;
    }

    setSortGroup(group);
    setSortDirection("desc");
  }

  const tableColumns: Array<{ key: MatchGroupKey; label: string }> = [
    { key: "official", label: t("statistics.filters.official") },
    { key: "competitive", label: t("statistics.filters.competitive") },
    { key: "nonOfficial", label: t("totalTop.table.short.nonOfficial") },
    { key: "all", label: t("statistics.filters.all") },
  ];

  return (
    <div className="text-slate-900">
      <header className="bg-estonia-dark px-6 py-8 text-white">
        <div className="mx-auto max-w-7xl">
          <div>
            <div className="text-center">
              <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-300">
                {t("totalTop.selectStat")}
              </label>
              <select
                value={selectedStat}
                onChange={(event) => setSelectedStat(event.target.value as TotalTopStatKey)}
                className="h-12 w-full rounded-xl border-2 border-estonia-blue/70 bg-white px-4 text-base font-semibold text-slate-900 shadow-md outline-none transition focus:border-estonia-blue"
              >
                {statOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 text-center">
              <div className="mb-2 text-xs uppercase tracking-[0.24em] text-slate-300">{t("totalTop.table.totals")} / {t("totalTop.table.perGame")}</div>
              <div className="grid w-full grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDisplayMode("total");
                    setSortDirection("desc");
                  }}
                  className={`w-full rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${displayMode === "total"
                    ? "border-estonia-blue bg-estonia-blue text-white"
                    : "border-white/30 bg-white/10 text-white/90 hover:bg-white/20"
                    }`}
                >
                  {t("totalTop.table.totals")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDisplayMode("perGame");
                    setSortDirection("desc");
                  }}
                  className={`w-full rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${displayMode === "perGame"
                    ? "border-estonia-blue bg-estonia-blue text-white"
                    : "border-white/30 bg-white/10 text-white/90 hover:bg-white/20"
                    }`}
                >
                  {t("totalTop.table.perGame")}
                </button>
              </div>
            </div>

            <div className="mt-5 text-center">
              <div className="mb-2 text-xs uppercase tracking-[0.24em] text-slate-300">{t("totalTop.positions.all")}</div>
              <div className="grid w-full grid-cols-3 gap-2 md:grid-cols-6">
                {positions.map((position) => (
                  <button
                    key={position}
                    type="button"
                    onClick={() => setSelectedPosition(position)}
                    className={`w-full rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors ${selectedPosition === position
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
      </header>

      <main className="mx-auto w-full max-w-[1800px] px-6 py-10">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table className="w-full min-w-[1280px]">
            <TableHeader>
              <TableRow className="bg-slate-100">
                <TableHead className="w-16 p-3 text-center align-middle">
                  {t("totalTop.table.rank")}
                </TableHead>
                <TableHead className="w-[460px] whitespace-nowrap p-4 text-left align-middle">
                  {t("totalTop.table.name")}
                </TableHead>
                <TableHead className="w-20 border-r-2 border-slate-300 p-3 text-center align-middle">
                  POS
                </TableHead>
                {tableColumns.map((column, index) => (
                  <TableHead
                    key={column.key}
                    className={`w-[210px] p-4 text-center align-middle text-xs font-semibold uppercase tracking-[0.2em] ${index < tableColumns.length - 1 ? "border-r border-slate-200" : ""} ${sortGroup === column.key ? "bg-estonia-blue/10 text-estonia-dark" : "text-slate-700"}`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSortByGroup(column.key)}
                      className="inline-flex w-full items-center justify-center gap-1"
                    >
                      {column.label}
                      <span>{sortGroup === column.key ? (sortDirection === "asc" ? "↑" : "↓") : "⇅"}</span>
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRows.map((row, index) => (
                <TableRow key={row.playerId}>
                  <TableCell className="w-16 p-3 text-center text-base font-medium text-slate-900">{index + 1}</TableCell>
                  <TableCell className="w-[460px] whitespace-nowrap p-4 text-left text-base font-medium text-slate-900">
                    <a href={`/players/${row.playerId}`} className="text-estonia-dark underline-offset-2 hover:text-estonia-blue hover:underline">
                      {row.name}
                    </a>
                  </TableCell>
                  <TableCell className="w-20 border-r-2 border-slate-300 p-3 text-center text-sm">{row.position ?? t("positions.Unknown")}</TableCell>

                  {tableColumns.map((column, idx) => (
                    <TableCell
                      key={`${row.playerId}-${column.key}`}
                      className={`w-[210px] p-4 text-center text-base font-semibold text-estonia-dark ${idx < tableColumns.length - 1 ? "border-r border-slate-200" : ""} ${sortGroup === column.key ? "bg-estonia-blue/10" : ""}`}
                    >
                      {formatStatValue(getValueForGroup(row, column.key))}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
