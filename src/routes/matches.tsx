import { useSuspenseQuery, useQueryErrorResetBoundary } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { allMatchesOptions, type MatchListItem } from "@/lib/matches.queries";
import { useTranslation } from "react-i18next";
import { FileText } from "lucide-react";
import {
  createFileRoute,
  useRouter,
  Outlet,
} from "@tanstack/react-router";

export const Route = createFileRoute("/matches")({
  head: () => ({
    meta: [
      { title: "Matches — Eesti Võrkpall DB" },
      {
        name: "description",
        content:
          "Complete archive of Estonia Men's National Volleyball Team matches: dates, opponents, competitions, and set scores.",
      },
      { property: "og:title", content: "Matches — Eesti Võrkpall DB" },
      {
        property: "og:description",
        content: "Every match played by the Estonia Men's National Volleyball Team.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(allMatchesOptions()),
  component: MatchesPage,
  errorComponent: MatchesError,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl uppercase italic">No matches</h1>
    </div>
  ),
});

function MatchesError({ error, reset }: { error: Error; reset: () => void }) {
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
function MatchesPage() {
  const { data: matches } = useSuspenseQuery(allMatchesOptions());
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState("");
  const [matchType, setMatchType] = useState<"ALL" | "OFFICIAL" | "COMPETITIVE">("OFFICIAL");
  const [year, setYear] = useState("ALL");
  const currentLanguage = i18n.language?.startsWith("et") ? "et" : "en";

  const years = useMemo(
    () =>
      [...new Set(matches.map((m) => m.match_date.slice(0, 4)))]
        .sort()
        .reverse(),
    [matches]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return matches.filter((m) => {
      if (matchType === "OFFICIAL" && !m.am) return false;
      if (matchType === "COMPETITIVE" && !m.vm) return false;
      if (year !== "ALL" && !m.match_date.startsWith(year)) return false;
      if (!q) return true;

      const opponent =
        currentLanguage === "et" ? m.opponent : m.opponent_en ?? m.opponent;
      const competition =
        currentLanguage === "et" ? m.competition : m.competition_en ?? m.competition;
      const city = currentLanguage === "et" ? m.city : m.city_en ?? m.city;

      return (
        opponent.toLowerCase().includes(q) ||
        (competition ?? "").toLowerCase().includes(q) ||
        (city ?? "").toLowerCase().includes(q)
      );
    });
  }, [matches, search, matchType, year, currentLanguage]);

  const vmMatches = matches.filter((m) => m.vm);
  const vmWins = vmMatches.filter(
    (m) => m.estonia_sets > m.opponent_sets
  ).length;
  const vmLosses = vmMatches.length - vmWins;

  const amMatches = matches.filter((m) => m.am);
  const amWins = amMatches.filter(
    (m) => m.estonia_sets > m.opponent_sets
  ).length;
  const amLosses = amMatches.length - amWins;

  const allMatches = matches.filter(
    (m) => m.am || m.mam
  );
  const allWins = allMatches.filter(
    (m) => m.estonia_sets > m.opponent_sets
  ).length;
  const allLosses = allMatches.length - allWins;

  return (
    <>
      <div className="text-slate-900">
        <header className="bg-estonia-dark px-6 py-12 text-white">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="mt-2 font-display text-4xl uppercase italic md:text-5xl">
                  {t("matches.title")}
                </h1>

                <p className="mt-2 max-w-2xl text-sm text-white/60">
                  {t("matches.subtitle")}
                </p>
              </div>

              <div className="w-full max-w-xl">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div>

                    <p className="text-xs leading-relaxed text-white/75">
                      {t("common.databaseExplanation")}
                    </p>

                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <StatGroup
                title={t("matches.competitiveMatches")}
                total={vmMatches.length}
                wins={vmWins}
                losses={vmLosses}
              />

              <StatGroup
                title={t("matches.officialMatches")}
                total={amMatches.length}
                wins={amWins}
                losses={amLosses}
              />

              <StatGroup
                title={t("matches.allMatches")}
                total={allMatches.length}
                wins={allWins}
                losses={allLosses}
              />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-6 py-10">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("matches.searchPlaceholder")}
              className="w-full max-w-sm rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-estonia-blue"
            />

            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm"
            >
              <option value="ALL">{t("matches.year")}</option>

              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <Segmented
              value={matchType}
              onChange={(v) => setMatchType(v as typeof matchType)}
              options={[
                { value: "OFFICIAL", label: t("matches.officialMatches") },
                { value: "COMPETITIVE", label: t("matches.competitiveMatches") },
                { value: "ALL", label: t("matches.allMatches") },
              ]}
            />

            <div className="ml-auto text-xs uppercase tracking-widest text-slate-400">
              {filtered.length} match{filtered.length === 1 ? "" : "es"}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="hidden grid-cols-13 gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 md:grid">

              <div className="col-span-2 text-center">
                {t("matches.date")}
              </div>

              <div className="col-span-3 text-center">
                {t("matches.opponent")}
              </div>

              <div className="col-span-3 text-center">
                {t("matches.score")}
              </div>

              <div className="col-span-2 text-center">
                {t("matches.competition")}
              </div>

              <div className="col-span-2 text-center">
                {t("matches.city")}
              </div>

              <div className="col-span-1 text-center">
                {t("matches.statistics")}
              </div>

            </div>
            {filtered.length === 0 ? (
              <div className="p-12 text-center">
                <p className="font-display text-xl uppercase italic text-slate-400">{t("common.noResults")}</p>
                <p className="mt-2 text-sm text-slate-500">Adjust filters or clear the search.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filtered.map((m) => (
                  <MatchRow key={m.match_id} match={m} matchType={matchType} />
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>

      <Outlet />
    </>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-l-2 border-estonia-blue pl-4 text-center">
      <div className="font-display text-3xl">{value.toLocaleString("en-US")}</div>
      <div className="mt-1 text-[10px] uppercase tracking-widest opacity-60">{label}</div>
    </div>
  );
}

function StatGroup({
  title,
  total,
  wins,
  losses,
}: {
  title: string;
  total: number;
  wins: number;
  losses: number;
}) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-white/20 bg-white/5 p-4">
      <div className="mb-4 border-b border-white/10 pb-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white">
        {title}
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <Kpi label={t("common.total")} value={total} />
        <Kpi label={t("common.wins")} value={wins} />
        <Kpi label={t("common.losses")} value={losses} />
      </div>
    </div>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-slate-200 bg-white text-xs font-semibold uppercase tracking-wide">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={
              active
                ? "bg-estonia-dark px-3 py-2 text-white"
                : "px-3 py-2 text-slate-500 hover:bg-slate-50"
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function MatchRow({ match, matchType }: { match: MatchListItem; matchType: "ALL" | "OFFICIAL" | "COMPETITIVE"; }) {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language?.startsWith("et") ? "et" : "en";
  const resultStyle =
    match.estonia_sets > match.opponent_sets
      ? "text-estonia-blue"
      : match.estonia_sets === match.opponent_sets
        ? "text-green-700"
        : "text-red-700";
  const opponent =
    currentLanguage === "et" ? match.opponent : match.opponent_en ?? match.opponent;
  const competition =
    currentLanguage === "et" ? match.competition : match.competition_en ?? match.competition;
  const city = currentLanguage === "et" ? match.city : match.city_en ?? match.city;
  const officialSetsPlayed = match.estonia_sets + match.opponent_sets;
  const officialSetScores = (match.match_sets ?? [])
    .filter((set) => set.set_number <= 5)
    .map((set) => `${set.estonia_points}:${set.opponent_points}`)
    .join(" • ");
  const additionalSetScores = (match.match_sets ?? [])
    .filter((set) => set.set_number > 5)
    .map((set) => `${set.estonia_points}:${set.opponent_points}`)
    .join(" • ");
  const hasAdditionalSets =
    match.has_additional_sets &&
    additionalSetScores !== "";
  const detailLine = match.notes;


  return (
    <li
      className={`grid grid-cols-1 gap-2 px-6 py-2 transition-colors hover:bg-slate-50 md:grid-cols-13 md:items-center md:gap-3 ${match.am ? "bg-white" : "bg-slate-100"
        }`}
    >
      <div className="col-span-2 text-center text-slate-500">
        {new Date(match.match_date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </div>

      <div className="col-span-3 flex items-center justify-center gap-2 text-center">

        <span className="font-display text-2xl uppercase text-slate-900">
          {opponent || "—"}
        </span>
      </div>

      <div className="col-span-3 flex items-center justify-center">
        <div
          className={`min-w-[110px] rounded-lg px-3 py-1 text-center ${resultStyle}`}
        >
          <div className="font-display text-2xl leading-none">
            {match.estonia_sets}–{match.opponent_sets}
          </div>

          {officialSetScores ? (
            <div className="mt-1 text-xs font-medium text-slate-700">
              {officialSetScores}
            </div>
          ) : null}

          {matchType === "ALL" && hasAdditionalSets && (
            <div className="mt-1 text-center text-[10px] italic text-amber-700">
              <span className="font-medium">
                {t("matches.additional_set", {
                  count: match.additional_sets_count,
                })}
              </span>
              {": "}
              <span>{additionalSetScores}</span>
            </div>
          )}

        </div>
      </div>

      <div className="col-span-2 text-center text-sm font-medium text-slate-700">
        {competition ?? "—"}
      </div>

      <div className="col-span-2 text-center text-sm text-slate-500">
        {city ?? "—"}
      </div>

      <div className="col-span-1 flex justify-center gap-1">
        <a
          href={`/matches/${match.match_id}`}
          title={t("matches.official_match")}
          className="text-red-600 transition-colors hover:text-red-700"
        >
          <FileText className="h-5 w-5" />
        </a>

        {matchType === "ALL" && match.has_additional_sets && (
          <a
            href={`/matches/${match.match_id}-all`}
            title={t("matches.match_with_additional_sets")}
            className="text-amber-500 transition-colors hover:text-amber-600"
          >
            <FileText className="h-5 w-5" />
          </a>
        )}
      </div >

      {
        detailLine ? (
          <div className="col-span-13 border-l-4 border-estonia-blue bg-blue-50 px-3 py-1 text-sm text-slate-600" >
            {detailLine}
          </div>
        ) : null
      }

    </li >
  );
}