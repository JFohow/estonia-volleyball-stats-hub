import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { coachOptions, type CoachPageData } from "@/lib/coaches.queries";

export const Route = createFileRoute("/coaches/$coachId")({
    component: CoachPage,
});

function CoachPage() {
    const { coachId } = Route.useParams();
    const { t, i18n } = useTranslation();

    const { data } = useSuspenseQuery(
        coachOptions(Number(coachId))
    );

    if (!data) {
        return null;
    }

    const coach = data.coach;
    const matches = data.matches;
    const lastMatchDate = data.lastMatchDate;
    const currentLanguage = i18n.language?.startsWith("et") ? "et" : "en";
    const [matchMode, setMatchMode] = useState<"official" | "competitive" | "all">("official");

    const formatDate = (dateString: string | null): string => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    const getMatchType = (match: typeof matches[number]): "VM" | "AM" | "MAM" | null => {
        if (match.vm) return "VM";
        if (match.am) return "AM";
        if (match.mam) return "MAM";
        return null;
    };

    const getResultStyle = (match: typeof matches[number]): string =>
        match.estonia_sets > match.opponent_sets
            ? "text-estonia-blue"
            : match.estonia_sets === match.opponent_sets
                ? "text-green-700"
                : "text-red-700";

    const getMatchRoute = (match: typeof matches[number]) =>
        getMatchType(match) === "MAM" ? "/match/$matchId-all" : "/match/$matchId";

    const sortedMatches = useMemo(
        () =>
            [...matches].sort(
                (a, b) =>
                    new Date(a.match_date).getTime() -
                    new Date(b.match_date).getTime()
            ),
        [matches]
    );

    const debutMatchDate = sortedMatches[0]?.match_date ?? coach.debut_date ?? null;

    const formatPercent = (value: number): string => `${Math.round(value * 10) / 10}%`;

    const buildSummary = (
        list: CoachPageData["matches"]
    ) => {
        const wins = list.filter(
            (m) => m.estonia_sets > m.opponent_sets
        ).length;
        const losses = list.filter(
            (m) => m.estonia_sets < m.opponent_sets
        ).length;
        const winPct = list.length > 0 ? (wins / list.length) * 100 : 0;

        return {
            total: list.length,
            wins,
            losses,
            winPct,
        };
    };

    const officialMatches = matches.filter((m) => m.am);
    const competitiveMatches = matches.filter((m) => m.vm);
    const allMatches = matches.filter((m) => m.am || m.mam);

    const filteredMatches =
        matchMode === "official"
            ? officialMatches
            : matchMode === "competitive"
                ? competitiveMatches
                : allMatches;

    const sortedFilteredMatches = useMemo(
        () =>
            [...filteredMatches].sort(
                (a, b) =>
                    new Date(a.match_date).getTime() -
                    new Date(b.match_date).getTime()
            ),
        [filteredMatches]
    );

    const officialSummary = buildSummary(officialMatches);
    const competitiveSummary = buildSummary(competitiveMatches);
    const allSummary = buildSummary(allMatches);

    const birthCountry = i18n.language?.startsWith("et") && coach.birth_country === "Estonia" ? "Eesti" : coach.birth_country;

    const dateOfBirthLabel = currentLanguage === "et" ? "Sunniaeg" : "Date of Birth";
    const nationalityLabel = currentLanguage === "et" ? "Rahvus" : "Nationality";
    const nationalTeamDebutLabel = currentLanguage === "et" ? "Koondise debuut" : "National Team Debut";
    const lastMatchLabel = currentLanguage === "et" ? "Viimane mang" : "Last Match";
    const matchHistoryTitle = currentLanguage === "et" ? "Koik mangud" : "Match History";
    const dateLabel = currentLanguage === "et" ? "Kuupaev" : "Date";
    const opponentLabel = currentLanguage === "et" ? "Vastane" : "Opponent";
    const scoreLabel = currentLanguage === "et" ? "Tulemus" : "Score";
    const competitionLabel = currentLanguage === "et" ? "Voistlus" : "Competition";
    const setsLabel = currentLanguage === "et" ? "Geime" : "Sets";
    const officialGamesLabel = currentLanguage === "et" ? "Ametlikud mangud" : "Official Games";
    const competitiveGamesLabel = currentLanguage === "et" ? "Voistlusmangud" : "Competitive Games";
    const allGamesLabel = currentLanguage === "et" ? "Koik mangud" : "All Games";
    const noMatchesLabel = currentLanguage === "et" ? "Mange ei leitud" : "No matches found";

    return (
        <div className="text-slate-900">
            <header className="bg-estonia-dark px-6 py-12 text-white">
                <div className="mx-auto max-w-7xl">
                    <div className="grid gap-8 lg:grid-cols-[220px_260px_260px_340px]">
                        {coach.photo_url ? (
                            <img
                                src={coach.photo_url}
                                alt={`${coach.first_name} ${coach.last_name}`}
                                className="h-63 w-48 rounded-2xl border-2 border-white/20 object-cover"
                            />
                        ) : (
                            <div className="grid h-63 w-48 place-items-center rounded-2xl border-2 border-white/20 bg-white/10 text-5xl">
                                🏐
                            </div>
                        )}

                        <div className="col-span-2">
                            <h1 className="font-display text-5xl uppercase italic">
                                {coach.first_name} {coach.last_name}
                            </h1>

                            <div className="mt-8 grid gap-x-16 gap-y-4 text-white/80 md:grid-cols-1">
                                <div className="space-y-5">
                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-white/50">
                                            {dateOfBirthLabel}
                                        </div>
                                        <div className="mt-1">🎂 {formatDate(coach.birth_date)}</div>
                                    </div>

                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-white/50">
                                            {nationalityLabel}
                                        </div>
                                        <div className="mt-1">🌍 {birthCountry || "-"}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <HeaderDateCard
                                title={nationalTeamDebutLabel}
                                date={debutMatchDate}
                            />
                            <HeaderDateCard
                                title={lastMatchLabel}
                                date={lastMatchDate}
                            />
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-10">
                <section className="mb-10 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-3">
                        <ResultCard
                            title={officialGamesLabel}
                            total={officialSummary.total}
                            wins={officialSummary.wins}
                            losses={officialSummary.losses}
                            winPct={formatPercent(officialSummary.winPct)}
                        />

                        <ResultCard
                            title={competitiveGamesLabel}
                            total={competitiveSummary.total}
                            wins={competitiveSummary.wins}
                            losses={competitiveSummary.losses}
                            winPct={formatPercent(competitiveSummary.winPct)}
                        />

                        <ResultCard
                            title={allGamesLabel}
                            total={allSummary.total}
                            wins={allSummary.wins}
                            losses={allSummary.losses}
                            winPct={formatPercent(allSummary.winPct)}
                        />
                    </div>
                </section>

                <h2 className="mb-6 font-display text-3xl uppercase italic">
                    {matchHistoryTitle}
                </h2>

                <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                    {(["official", "competitive", "all"] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setMatchMode(mode)}
                            className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${matchMode === mode
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                                }`}
                        >
                            {mode === "official"
                                ? officialGamesLabel
                                : mode === "competitive"
                                    ? competitiveGamesLabel
                                    : allGamesLabel}
                        </button>
                    ))}
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="grid grid-cols-12 gap-3 border-b border-slate-100 bg-slate-50 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <div className="col-span-1 text-center">#</div>
                        <div className="col-span-2">{dateLabel}</div>
                        <div className="col-span-3">{opponentLabel}</div>
                        <div className="col-span-2 text-center">{scoreLabel}</div>
                        <div className="col-span-4">{competitionLabel}</div>
                    </div>

                    {sortedFilteredMatches.length > 0 ? (
                        sortedFilteredMatches.map((match, index) => (
                            <div
                                key={match.match_id}
                                className="grid grid-cols-12 gap-3 border-t border-slate-100 px-6 py-4"
                            >
                                <div className="col-span-1 text-center text-slate-500">
                                    {index + 1}
                                </div>

                                <div className="col-span-2">
                                    {new Date(match.match_date).toLocaleDateString("en-GB")}
                                </div>

                                <div className="col-span-3">
                                    {match.opponent}
                                </div>

                                <div className="col-span-2 text-center">
                                    <Link
                                        to={getMatchRoute(match)}
                                        params={{
                                            matchId: String(match.match_id),
                                        }}
                                        className={`font-semibold hover:underline ${getResultStyle(match)}`}
                                    >
                                        {match.estonia_sets}–{match.opponent_sets}
                                    </Link>
                                </div>

                                <div className="col-span-4">
                                    {match.competition || "-"}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="px-8 py-12 text-center text-slate-600">
                            {noMatchesLabel}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function ResultCard({
    title,
    total,
    wins,
    losses,
    winPct,
}: {
    title: string;
    total: number;
    wins: number;
    losses: number;
    winPct: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                {title}
            </div>
            <div className="mt-3 text-center text-3xl font-black text-slate-900">
                {total}
                <span className="ml-2 text-xl font-bold text-slate-700">({wins} - {losses})</span>
            </div>
            <div className="mt-2 text-center text-sm font-bold uppercase tracking-wide text-slate-700">
                WIN%: {winPct}
            </div>
        </div>
    );
}

function HeaderDateCard({
    title,
    date,
}: {
    title: string;
    date: string | null;
}) {
    return (
        <div className="rounded-lg border border-white/20 bg-white/5 p-3">
            <div className="text-center text-[11px] uppercase tracking-[0.2em] text-white/60">
                {title}
            </div>
            <div className="mt-2 text-center text-sm font-semibold text-white">
                {date ? new Date(date).toLocaleDateString("en-GB") : "-"}
            </div>
        </div>
    );
}
