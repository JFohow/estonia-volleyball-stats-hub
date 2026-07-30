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
type SortColumnKey = `${SortMode}:${MatchGroupKey}`;

function TotalTopPage() {
  const { t } = useTranslation();
  const { data } = useSuspenseQuery(totalTopOptions());
  const [selectedPosition, setSelectedPosition] = useState<string>("ALL");
  const [selectedStat, setSelectedStat] = useState<TotalTopStatKey>("points");
  const [sortColumn, setSortColumn] = useState<SortColumnKey>("total:official");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const positions = useMemo(() => ["ALL", ...positionOrder], []);
  const statOptions: Array<{ value: TotalTopStatKey; label: string }> = useMemo(
    () => [
      { value: "points", label: t("players.statsField.points") },
      { value: "blockPoints", label: t("players.statsField.blockPoints") },
      { value: "plusMinus", label: t("players.statsField.plusMinus") },
      { value: "serveTotal", label: t("players.statsField.serveTotal") },
      { value: "serveAces", label: t("players.statsField.serveAces") },
      { value: "serveErrors", label: t("players.statsField.serveErrors") },
      { value: "receptionTotal", label: t("players.statsField.receptionTotal") },
      { value: "receptionErrors", label: t("players.statsField.receptionErrors") },
      { value: "receptionPositivePct", label: t("players.statsField.receptionPositivePct") },
      { value: "receptionExcellentPct", label: t("players.statsField.receptionExcellentPct") },
      { value: "attackTotal", label: t("players.statsField.attackTotal") },
      { value: "attackErrors", label: t("players.statsField.attackErrors") },
      { value: "attackBlocked", label: t("players.statsField.attackBlocked") },
      { value: "attackKills", label: t("players.statsField.attackKills") },
      { value: "attackKillPct", label: t("players.statsField.attackKillPct") },
      { value: "attackEfficiency", label: t("players.statsField.attackEfficiency") },
      { value: "breakPoints", label: t("players.statsField.breakPoints") },
    ],
    [t]
  );

  function getStatValue(group: PlayerTotals, stat: TotalTopStatKey) {
    return group[stat];
  }

  function getPerGameValue(group: PlayerTotals, stat: TotalTopStatKey) {
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

  const groupForSort: Record<SortColumnKey, MatchGroupKey> = {
    "perGame:official": "official",
    "perGame:competitive": "competitive",
    "perGame:nonOfficial": "nonOfficial",
    "perGame:all": "all",
    "total:official": "official",
    "total:competitive": "competitive",
    "total:nonOfficial": "nonOfficial",
    "total:all": "all",
  };

  const sortedRows = useMemo(() => {
    const sortGroup = groupForSort[sortColumn];
    const sortMode: SortMode = sortColumn.startsWith("perGame:") ? "perGame" : "total";

    return [...filteredRows].sort((a, b) => {
      const aValue = sortMode === "perGame"
        ? getPerGameValue(a[sortGroup], selectedStat) ?? 0
        : getStatValue(a[sortGroup], selectedStat) ?? 0;
      const bValue = sortMode === "perGame"
        ? getPerGameValue(b[sortGroup], selectedStat) ?? 0
        : getStatValue(b[sortGroup], selectedStat) ?? 0;

      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });
  }, [filteredRows, selectedStat, sortColumn, sortDirection]);

  function handleSort(column: SortColumnKey) {
    if (sortColumn === column) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
      return;
    }

    setSortColumn(column);
    setSortDirection("desc");
  }

  const columnDefs: Array<{ key: SortColumnKey; label: string }> = [
    { key: "total:official", label: t("totalTop.table.short.official") },
    { key: "total:competitive", label: t("totalTop.table.short.competitive") },
    { key: "total:nonOfficial", label: t("totalTop.table.short.nonOfficial") },
    { key: "total:all", label: t("totalTop.table.short.all") },
    { key: "perGame:official", label: t("totalTop.table.short.official") },
    { key: "perGame:competitive", label: t("totalTop.table.short.competitive") },
    { key: "perGame:nonOfficial", label: t("totalTop.table.short.nonOfficial") },
    { key: "perGame:all", label: t("totalTop.table.short.all") },
  ];

  return (
    <div className="text-slate-900">
      <header className="bg-estonia-dark px-6 py-8 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="text-center">
              <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-300">
                {t("totalTop.selectStat")}
              </label>
              <select
                value={selectedStat}
                onChange={(event) => setSelectedStat(event.target.value as TotalTopStatKey)}
                className="mx-auto h-12 w-full max-w-[520px] rounded-xl border-2 border-estonia-blue/70 bg-white px-4 text-base font-semibold text-slate-900 shadow-md outline-none transition focus:border-estonia-blue"
              >
                {statOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-center">
              <div className="mb-2 text-xs uppercase tracking-[0.24em] text-slate-300">{t("totalTop.positions.all")}</div>
              <div className="mx-auto grid w-full max-w-[440px] grid-cols-3 gap-2">
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

      <main className="mx-auto w-full max-w-[1400px] px-6 py-10">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-slate-100">
                <TableHead rowSpan={2} className="w-12 p-2 text-center align-middle">
                  {t("totalTop.table.rank")}
                </TableHead>
                <TableHead rowSpan={2} className="w-[340px] whitespace-nowrap p-3 text-left align-middle">
                  {t("totalTop.table.name")}
                </TableHead>
                <TableHead rowSpan={2} className="w-16 border-r-2 border-slate-300 p-2 text-center align-middle">
                  POS
                </TableHead>
                <TableHead colSpan={4} className="p-3 text-center text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {t("totalTop.table.totals")}
                </TableHead>
                <TableHead colSpan={4} className="p-3 text-center text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {t("totalTop.table.perGame")}
                </TableHead>
              </TableRow>
              <TableRow className="bg-slate-50">
                {columnDefs.map((column) => (
                  <TableHead key={column.key} className={`w-[120px] p-3 text-center ${
                    sortColumn === column.key ? "bg-estonia-blue/10 text-estonia-dark" : "text-slate-700"
                  } ${column.key === "total:all" || column.key === "perGame:nonOfficial" ? "border-r-2 border-slate-300" : ""} ${column.key === "perGame:official" ? "border-l-2 border-slate-300" : ""}`}>
                    <button
                      type="button"
                      onClick={() => handleSort(column.key)}
                      className="inline-flex w-full items-center justify-center gap-1 text-left text-[10px] font-semibold uppercase tracking-[0.2em]"
                    >
                      {column.label}
                      <span>{sortColumn === column.key ? (sortDirection === "asc" ? "↑" : "↓") : "⇅"}</span>
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRows.map((row, index) => (
                <TableRow key={row.playerId}>
                  <TableCell className="w-12 p-2 text-center font-medium text-slate-900">{index + 1}</TableCell>
                  <TableCell className="w-[340px] whitespace-nowrap p-3 text-left font-medium text-slate-900">
                    <a href={`/players/${row.playerId}`} className="text-estonia-dark underline-offset-2 hover:text-estonia-blue hover:underline">
                      {row.name}
                    </a>
                  </TableCell>
                  <TableCell className="w-16 border-r-2 border-slate-300 p-2 text-center">{row.position ?? t("positions.Unknown")}</TableCell>

                  <TableCell className={`w-[120px] p-3 text-center font-semibold text-estonia-dark ${sortColumn === "total:official" ? "bg-estonia-blue/10 font-bold" : ""}`}>
                    {formatStatValue(getStatValue(row.official, selectedStat))}
                  </TableCell>

                  <TableCell className={`w-[120px] p-3 text-center font-semibold text-estonia-dark ${sortColumn === "total:competitive" ? "bg-estonia-blue/10 font-bold" : ""}`}>
                    {formatStatValue(getStatValue(row.competitive, selectedStat))}
                  </TableCell>

                  <TableCell className={`w-[120px] border-r-2 border-slate-300 p-3 text-center font-semibold text-estonia-dark ${sortColumn === "total:nonOfficial" ? "bg-estonia-blue/10 font-bold" : ""}`}>
                    {formatStatValue(getStatValue(row.nonOfficial, selectedStat))}
                  </TableCell>

                  <TableCell className={`w-[120px] border-r-2 border-slate-300 p-3 text-center font-semibold text-estonia-dark ${sortColumn === "total:all" ? "bg-estonia-blue/10 font-bold" : ""}`}>
                    {formatStatValue(getStatValue(row.all, selectedStat))}
                  </TableCell>

                  <TableCell className={`w-[120px] border-l-2 border-slate-300 p-3 text-center ${sortColumn === "perGame:official" ? "bg-estonia-blue/10 font-bold text-estonia-dark" : ""}`}>
                    {formatStatValue(getPerGameValue(row.official, selectedStat))}
                  </TableCell>

                  <TableCell className={`w-[120px] p-3 text-center ${sortColumn === "perGame:competitive" ? "bg-estonia-blue/10 font-bold text-estonia-dark" : ""}`}>
                    {formatStatValue(getPerGameValue(row.competitive, selectedStat))}
                  </TableCell>

                  <TableCell className={`w-[120px] border-r-2 border-slate-300 p-3 text-center ${sortColumn === "perGame:nonOfficial" ? "bg-estonia-blue/10 font-bold text-estonia-dark" : ""}`}>
                    {formatStatValue(getPerGameValue(row.nonOfficial, selectedStat))}
                  </TableCell>

                  <TableCell className={`w-[120px] p-3 text-center ${sortColumn === "perGame:all" ? "bg-estonia-blue/10 font-bold text-estonia-dark" : ""}`}>
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
