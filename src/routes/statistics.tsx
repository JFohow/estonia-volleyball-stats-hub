import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
    formatDisplayValue,
    getDisplayValue,
    statisticsOptions,
    type PlayerStatisticsRow,
    type StatisticsField,
    type StatisticsMode,
} from "@/lib/statistics.queries";
import { useTranslation } from "react-i18next";

type SortField = StatisticsField | "name";

const columns: Array<{ field: StatisticsField; label: string }> = [
    { field: "points", label: "PTS" },
    { field: "block_points", label: "BP" },
    { field: "plus_minus", label: "W-P" },
    { field: "serve_total", label: "Tot" },
    { field: "serve_aces", label: "Ace" },
    { field: "serve_errors", label: "Err" },
    { field: "reception_total", label: "Tot" },
    { field: "reception_errors", label: "Err" },
    { field: "reception_positive_pct", label: "Pos%" },
    { field: "reception_excellent_pct", label: "Exc%" },
    { field: "attack_total", label: "Tot" },
    { field: "attack_errors", label: "Err" },
    { field: "attack_blocked", label: "Blk" },
    { field: "attack_kills", label: "Exc." },
    { field: "attack_kill_pct", label: "Exc.%" },
    { field: "attack_efficiency", label: "Eff%" },
    { field: "break_points", label: "PTS" },
];

const modes: StatisticsMode[] = ["official", "competitive", "nonCompetitive", "all"];

export const Route = createFileRoute("/statistics")({
    loader: ({ context }) => context.queryClient.ensureQueryData(statisticsOptions()),
    component: StatisticsPage,
});

function StatisticsPage() {
    const { t } = useTranslation();
    const { data } = useSuspenseQuery(statisticsOptions());

    const [mode, setMode] = useState<StatisticsMode>("official");
    const [sortField, setSortField] = useState<SortField | "appearances">("appearances");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

    const rows = useMemo(() => {
        const copy = [...data];

        copy.sort((a, b) => {
            if (sortField === "name") {
                const comp = a.name.localeCompare(b.name);
                return sortDirection === "asc" ? comp : -comp;
            }

            if (sortField === "appearances") {
                const aValue = a[mode].appearances;
                const bValue = b[mode].appearances;
                return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
            }

            const aValue = getDisplayValue(a[mode], sortField);
            const bValue = getDisplayValue(b[mode], sortField);
            return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        });

        return copy;
    }, [data, mode, sortDirection, sortField]);

    function handleSort(field: SortField | "appearances") {
        if (sortField === field) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }

        setSortField(field);
        setSortDirection(field === "name" ? "asc" : "desc");
    }

    return (
        <main className="mx-auto max-w-7xl px-6 py-10">
            <div className="mb-6 flex flex-wrap gap-2">
                {modes.map((currentMode) => (
                    <button
                        key={currentMode}
                        type="button"
                        onClick={() => setMode(currentMode)}
                        className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${mode === currentMode
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                            }`}
                    >
                        {t(`statistics.filters.${currentMode}`)}
                    </button>
                ))}
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full min-w-[1200px] border-collapse">
                    <thead className="bg-slate-50">
                        <tr className="border-b-2 border-slate-300">
                            <th rowSpan={2} className="sticky left-0 z-10 border-r-2 border-slate-300 bg-slate-50 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
                                <button
                                    type="button"
                                    onClick={() => handleSort("name")}
                                    className="inline-flex items-center gap-2"
                                >
                                    {t("statistics.table.player")}
                                    <span>{sortField === "name" ? (sortDirection === "asc" ? "↑" : "↓") : "⇅"}</span>
                                </button>
                            </th>

                            <th rowSpan={2} className="border-r-2 border-slate-300 px-2 py-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
                                <button
                                    type="button"
                                    onClick={() => handleSort("appearances")}
                                    className="inline-flex items-center gap-1"
                                >
                                    {t("statistics.table.appearances")}
                                    <span>{sortField === "appearances" ? (sortDirection === "asc" ? "↑" : "↓") : "⇅"}</span>
                                </button>
                            </th>

                            <th colSpan={3} className="border-r-2 border-slate-300 px-2 py-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                                {t("statistics.table.points")}
                            </th>

                            <th colSpan={3} className="border-r-2 border-slate-300 px-2 py-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                                {t("statistics.table.serve")}
                            </th>

                            <th colSpan={4} className="border-r-2 border-slate-300 px-2 py-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                                {t("statistics.table.reception")}
                            </th>

                            <th colSpan={6} className="border-r-2 border-slate-300 px-2 py-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                                {t("statistics.table.attack")}
                            </th>

                            <th colSpan={1} className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                                {t("statistics.table.block")}
                            </th>
                        </tr>

                        <tr className="border-b-2 border-slate-300">

                            {columns.map((column) => (
                                <th
                                    key={`${column.field}-${column.label}`}
                                    className={`px-2 py-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 ${
                                        column.field === "plus_minus" || column.field === "serve_errors" || column.field === "reception_excellent_pct" || column.field === "attack_efficiency"
                                            ? "border-r-2 border-slate-300"
                                            : "border-r border-slate-200"
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleSort(column.field)}
                                        className="inline-flex items-center gap-1"
                                    >
                                        {column.label}
                                        <span>{sortField === column.field ? (sortDirection === "asc" ? "↑" : "↓") : "⇅"}</span>
                                    </button>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {rows.map((row, idx) => (
                            <PlayerStatisticsTableRow key={row.playerId} row={row} mode={mode} index={idx} />
                        ))}
                    </tbody>
                </table>

                {rows.length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-500">{t("statistics.empty")}</div>
                )}
            </div>
        </main>
    );
}

function PlayerStatisticsTableRow({
    row,
    mode,
    index,
}: {
    row: PlayerStatisticsRow;
    mode: StatisticsMode;
    index: number;
}) {
    const group = row[mode];

    return (
        <tr className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
            <td className="sticky left-0 z-10 border-r-2 border-slate-300 bg-inherit px-4 py-3 text-sm font-semibold text-slate-900">
                {row.name}
            </td>

            <td className="border-r-2 border-slate-300 px-2 py-3 text-center text-sm text-slate-700">
                {group.appearances}
            </td>

            {columns.map((column) => (
                <td
                    key={`${column.field}-${column.label}`}
                    className={`px-2 py-3 text-center text-sm text-slate-700 ${
                        column.field === "plus_minus" || column.field === "serve_errors" || column.field === "reception_excellent_pct" || column.field === "attack_efficiency"
                            ? "border-r-2 border-slate-300"
                            : "border-r border-slate-200"
                    }`}
                >
                    {formatDisplayValue(group, column.field)}
                </td>
            ))}
        </tr>
    );
}
