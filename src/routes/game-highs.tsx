import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { gameHighsOptions, type GameHighRow } from "@/lib/game-highs.queries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslation } from "react-i18next";

const positionOrder = ["SET", "OPP", "OH", "MB", "LIB"];

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
  const { t } = useTranslation();
  const { data } = useSuspenseQuery(gameHighsOptions());
  const [selectedPosition, setSelectedPosition] = useState<string>("ALL");
  const [matchType, setMatchType] = useState<"ALL" | "OFFICIAL" | "COMPETITIVE">("ALL");
  const [category, setCategory] = useState<"points" | "serveAces" | "attackKills" | "blockPoints">("points");

  const positions = useMemo(() => ["ALL", ...positionOrder], []);

  const rows = useMemo(() => {
    const filtered = data.filter((row) => {
      if (selectedPosition !== "ALL" && row.position !== selectedPosition) {
        return false;
      }

      if (matchType === "OFFICIAL") {
        return row.am === true;
      }

      if (matchType === "COMPETITIVE") {
        return row.vm === true;
      }

      return true;
    });

    const ranked = [...filtered].sort((a, b) => {
      const aValue = a[category] ?? 0;
      const bValue = b[category] ?? 0;

      if (bValue !== aValue) {
        return bValue - aValue;
      }

      return new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime();
    });

    return ranked.slice(0, 10);
  }, [data, selectedPosition, matchType, category]);

  const categoryLabel = {
    points: t("gameHighs.categories.points"),
    serveAces: t("gameHighs.categories.serveAces"),
    attackKills: t("gameHighs.categories.attackKills"),
    blockPoints: t("gameHighs.categories.blockPoints"),
  };

  const categoryDescription = {
    points: t("gameHighs.categoryDescriptions.points"),
    serveAces: t("gameHighs.categoryDescriptions.serveAces"),
    attackKills: t("gameHighs.categoryDescriptions.attackKills"),
    blockPoints: t("gameHighs.categoryDescriptions.blockPoints"),
  };

  return (
    <div className="text-slate-900">
      <header className="bg-estonia-dark px-6 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <h1 className="mt-2 font-display text-4xl uppercase italic md:text-5xl">
            {t("gameHighs.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70">
            {t("gameHighs.subtitle")}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <StatCard label={t("common.competitive")} value={data.filter((row) => row.vm === true).length} />
            <StatCard label={t("common.official")} value={data.filter((row) => row.am === true).length} />
            <StatCard label={t("common.allMatches")} value={data.length} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-6 py-10">
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
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
                  {position === "ALL" ? t("gameHighs.positions.all") : t(`positions.${position}`)}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { value: "OFFICIAL", label: t("matches.officialMatches") },
                { value: "COMPETITIVE", label: t("matches.competitiveMatches") },
                { value: "ALL", label: t("matches.allMatches") },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMatchType(option.value as typeof matchType)}
                  className={`rounded-md border px-3 py-2 text-sm transition-colors ${matchType === option.value
                    ? "border-estonia-blue bg-estonia-blue text-white"
                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
              {t("gameHighs.currentCategory")}
            </div>
            <div className="mt-3 text-2xl font-semibold text-estonia-dark">{categoryLabel[category]}</div>
            <p className="mt-2 text-sm text-slate-600">{categoryDescription[category]}</p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {(
                [
                  { value: "points", label: t("gameHighs.categories.points") },
                  { value: "serveAces", label: t("gameHighs.categories.serveAces") },
                  { value: "attackKills", label: t("gameHighs.categories.attackKills") },
                  { value: "blockPoints", label: t("gameHighs.categories.blockPoints") },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCategory(option.value)}
                  className={`rounded-md border px-3 py-2 text-sm transition-colors ${category === option.value
                    ? "border-estonia-blue bg-estonia-blue text-white"
                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-slate-50">
                  <TableHead className="p-3 text-center">{t("gameHighs.table.rank")}</TableHead>
                  <TableHead className="p-3 text-center">{t("gameHighs.table.name")}</TableHead>
                  <TableHead className="p-3 text-center">{t("gameHighs.table.value")}</TableHead>
                  <TableHead className="p-3 text-center">{t("gameHighs.table.position")}</TableHead>
                  <TableHead className="p-3 text-center">{t("gameHighs.table.opponent")}</TableHead>
                  <TableHead className="p-3 text-center">{t("gameHighs.table.score")}</TableHead>
                  <TableHead className="p-3 text-center">{t("gameHighs.table.date")}</TableHead>
                  <TableHead className="p-3 text-center">{t("gameHighs.table.competition")}</TableHead>
                  <TableHead className="p-3 text-center">{t("gameHighs.table.matchLink")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={row.appearanceId}>
                    <TableCell className="p-3 text-center font-medium text-slate-900">{index + 1}</TableCell>
                    <TableCell className="p-3 text-center font-medium text-slate-900">{row.name}</TableCell>
                    <TableCell className="p-3 text-center font-semibold text-estonia-dark">{row[category] ?? 0}</TableCell>
                    <TableCell className="p-3 text-center">{row.position}</TableCell>
                    <TableCell className="p-3 text-center">{row.opponent}</TableCell>
                    <TableCell className="p-3 text-center">{row.score}</TableCell>
                    <TableCell className="p-3 text-center">{new Date(row.matchDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}</TableCell>
                    <TableCell className="p-3 text-center">{row.competition ?? "—"}</TableCell>
                    <TableCell className="p-3 text-center">
                      <a href={`/stats/${row.matchId}`} className="text-estonia-blue hover:underline">
                        PDF
                      </a>
                    </TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {rows.length === 0 && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-12 text-center text-slate-500">
            {t("common.noResults")}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
      <div className="text-sm uppercase tracking-[0.24em] text-slate-500">{label}</div>
      <div className="mt-4 text-4xl font-display text-estonia-dark">{value}</div>
    </div>
  );
}
