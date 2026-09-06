import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import {
    triviaOptions,
    type TriviaCityRow,
    type TriviaMatchDurationRow,
    type TriviaMatchTotalRow,
    type TriviaMode,
    type TriviaSetRow,
} from "@/lib/trivia.queries";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/trivia")({
    head: () => ({
        meta: [
            { title: "TRIVIA — Eesti Vorkpall DB" },
            {
                name: "description",
                content:
                    "Top 10 trivia lists from Estonia Men's National Volleyball match data.",
            },
        ],
    }),
    loader: ({ context }) => context.queryClient.ensureQueryData(triviaOptions()),
    component: TriviaPage,
});

type Section = {
    key: string;
    title: string;
    content: ReactNode;
};

type TriviaText = {
    intro: string;
    rank: string;
    city: string;
    matches: string;
    date: string;
    opponent: string;
    score: string;
    competition: string;
    estoniaPoints: string;
    opponentPoints: string;
    setScore: string;
    durationMinutes: string;
    matchType: string;
    sections: {
        topCities: string;
        topAbroadCities: string;
        leastEstPoints: string;
        leastOppPoints: string;
        mostEstPoints: string;
        mostOppPoints: string;
        highestScoringSets: string;
        lowestScoringSets: string;
        shortestSetDuration: string;
        longestSetDuration: string;
        shortestMatchDuration: string;
        longestMatchDuration: string;
    };
};

function TriviaPage() {
    const { data } = useSuspenseQuery(triviaOptions());
    const { i18n, t } = useTranslation();
    const [mode, setMode] = useState<TriviaMode>("official");

    const isEstonian = i18n.language?.startsWith("et") ?? false;

    const text: TriviaText = isEstonian
        ? {
            intro: "Siit saab leida triviaalseid statistilisi noppeid Eesti meeste koondise kohta.",
            rank: "#",
            city: "Linn",
            matches: "Mange",
            date: "Kuupaev",
            opponent: "Vastane",
            score: "Skor",
            competition: "Voistlus",
            estoniaPoints: "Eesti punktid",
            opponentPoints: "Vastase punktid",
            setScore: "Geimi skoor",
            durationMinutes: "Minutid",
            matchType: "Mangu tuup",
            sections: {
                topCities: "Linnad, kus Eesti on koige rohkem manginud",
                topAbroadCities: "Linnad, kus Eesti on valismaal koige rohkem manginud",
                leastEstPoints: "Mangud koige vahemate Eesti punktidega",
                leastOppPoints: "Mangud koige vahemate vastase punktidega",
                mostEstPoints: "Mangud koige rohkemate Eesti punktidega",
                mostOppPoints: "Mangud koige rohkemate vastase punktidega",
                highestScoringSets: "Koige suurema punktisummaga geimid",
                lowestScoringSets: "Koige vaiksema punktisummaga geimid",
                shortestSetDuration: "Luhimad geimid minutites",
                longestSetDuration: "Pikimad geimid minutites",
                shortestMatchDuration: "Luhimad mangud minutites",
                longestMatchDuration: "Pikimad mangud minutites",
            },
        }
        : {
            intro: "Here one can find trivial statistical slices about Estonian Men's National Volleyball Team.",
            rank: "#",
            city: "City",
            matches: "Matches",
            date: "Date",
            opponent: "Opponent",
            score: "Score",
            competition: "Competition",
            estoniaPoints: "Estonia points",
            opponentPoints: "Opponent points",
            setScore: "Set Score",
            durationMinutes: "Minutes",
            matchType: "Match type",
            sections: {
                topCities: "Cities where Estonia has played the most",
                topAbroadCities: "Cities where Estonia has played the most abroad",
                leastEstPoints: "Matches with least Estonia points",
                leastOppPoints: "Matches with least opponent points",
                mostEstPoints: "Matches with most Estonia points",
                mostOppPoints: "Matches with most opponent points",
                highestScoringSets: "Highest scoring sets",
                lowestScoringSets: "Lowest scoring sets",
                shortestSetDuration: "Shortest set in minutes",
                longestSetDuration: "Longest set in minutes",
                shortestMatchDuration: "Shortest match in minutes",
                longestMatchDuration: "Longest match in minutes",
            },
        };

    const modeData = data[mode];

    const sections: Section[] = [
        {
            key: "topCities",
            title: text.sections.topCities,
            content: <CitiesTable rows={modeData.topCities} isEstonian={isEstonian} text={text} />,
        },
        {
            key: "topAbroadCities",
            title: text.sections.topAbroadCities,
            content: <CitiesTable rows={modeData.topAbroadCities} isEstonian={isEstonian} text={text} />,
        },
        {
            key: "leastEstPoints",
            title: text.sections.leastEstPoints,
            content: (
                <MatchPointsTable
                    rows={modeData.leastEstoniaPointsMatches}
                    isEstonian={isEstonian}
                    text={text}
                    pointsKey="estoniaPoints"
                />
            ),
        },
        {
            key: "leastOppPoints",
            title: text.sections.leastOppPoints,
            content: (
                <MatchPointsTable
                    rows={modeData.leastOpponentPointsMatches}
                    isEstonian={isEstonian}
                    text={text}
                    pointsKey="opponentPoints"
                />
            ),
        },
        {
            key: "mostEstPoints",
            title: text.sections.mostEstPoints,
            content: (
                <MatchPointsTable
                    rows={modeData.mostEstoniaPointsMatches}
                    isEstonian={isEstonian}
                    text={text}
                    pointsKey="estoniaPoints"
                />
            ),
        },
        {
            key: "mostOppPoints",
            title: text.sections.mostOppPoints,
            content: (
                <MatchPointsTable
                    rows={modeData.mostOpponentPointsMatches}
                    isEstonian={isEstonian}
                    text={text}
                    pointsKey="opponentPoints"
                />
            ),
        },
        {
            key: "highestScoringSets",
            title: text.sections.highestScoringSets,
            content: <SetsTable rows={modeData.highestScoringSets} isEstonian={isEstonian} text={text} />,
        },
        {
            key: "lowestScoringSets",
            title: text.sections.lowestScoringSets,
            content: <SetsTable rows={modeData.lowestScoringSets} isEstonian={isEstonian} text={text} />,
        },
        {
            key: "shortestSetDuration",
            title: text.sections.shortestSetDuration,
            content: <SetsTable rows={modeData.shortestSets} isEstonian={isEstonian} text={text} showDuration />,
        },
        {
            key: "longestSetDuration",
            title: text.sections.longestSetDuration,
            content: <SetsTable rows={modeData.longestSets} isEstonian={isEstonian} text={text} showDuration />,
        },
        {
            key: "shortestMatchDuration",
            title: text.sections.shortestMatchDuration,
            content: <MatchDurationTable rows={modeData.shortestMatches} isEstonian={isEstonian} text={text} />,
        },
        {
            key: "longestMatchDuration",
            title: text.sections.longestMatchDuration,
            content: <MatchDurationTable rows={modeData.longestMatches} isEstonian={isEstonian} text={text} />,
        },
    ];

    return (
        <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 sm:py-10 lg:px-14">
            <header className="relative overflow-hidden rounded-3xl border border-sky-100 bg-[radial-gradient(circle_at_top_left,_#dbeafe_0%,_#f8fafc_42%,_#e2e8f0_100%)] px-6 py-8 shadow-sm md:px-10 md:py-10">
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-estonia-blue/20 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-10 h-52 w-52 rounded-full bg-slate-300/35 blur-2xl" />

                <p className="relative max-w-3xl text-base text-slate-700 sm:text-lg">{text.intro}</p>
                <div className="relative mt-5">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {text.matchType}
                    </div>
                    <div className="grid w-full max-w-[640px] grid-cols-2 gap-2 sm:grid-cols-4">
                        {(["official", "competitive", "nonCompetitive", "all"] as TriviaMode[]).map((currentMode) => (
                            <button
                                key={currentMode}
                                type="button"
                                onClick={() => setMode(currentMode)}
                                className={`w-full rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${mode === currentMode
                                    ? "border-estonia-blue bg-estonia-blue text-white"
                                    : "border-slate-300 bg-white/70 text-slate-700 hover:bg-white"
                                    }`}
                            >
                                {t(`statistics.filters.${currentMode}`)}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <section className="mt-8 grid gap-5 lg:grid-cols-2">
                {sections.map((section) => (
                    <article
                        key={section.key}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                    >
                        <h2 className="mb-3 font-display text-2xl uppercase italic text-slate-900">{section.title}</h2>
                        {section.content}
                    </article>
                ))}
            </section>
        </main>
    );
}

function CitiesTable({ rows, isEstonian, text }: { rows: TriviaCityRow[]; isEstonian: boolean; text: TriviaText }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-2 py-2">{text.rank}</th>
                        <th className="px-2 py-2">{text.city}</th>
                        <th className="px-2 py-2 text-right">{text.matches}</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => {
                        const city = isEstonian ? row.city : row.cityEn ?? row.city;
                        return (
                            <tr key={`${row.city}-${index}`} className="border-b border-slate-100 last:border-b-0">
                                <td className="px-2 py-2 font-semibold text-slate-500">{index + 1}</td>
                                <td className="px-2 py-2 font-medium text-slate-800">{city}</td>
                                <td className="px-2 py-2 text-right font-semibold text-estonia-dark">{row.count}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function MatchPointsTable({
    rows,
    isEstonian,
    text,
    pointsKey,
}: {
    rows: TriviaMatchTotalRow[];
    isEstonian: boolean;
    text: TriviaText;
    pointsKey: "estoniaPoints" | "opponentPoints";
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-2 py-2">{text.rank}</th>
                        <th className="px-2 py-2">{text.date}</th>
                        <th className="px-2 py-2">{text.opponent}</th>
                        <th className="px-2 py-2 text-center">{text.score}</th>
                        <th className="px-2 py-2 text-right">
                            {pointsKey === "estoniaPoints" ? text.estoniaPoints : text.opponentPoints}
                        </th>
                        <th className="px-2 py-2">{text.competition}</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => {
                        const opponent = isEstonian ? row.opponent : row.opponentEn ?? row.opponent;
                        const competition = isEstonian
                            ? row.competition
                            : row.competitionEn ?? row.competition;
                        const scoreTarget = row.hasAdditionalSets ? `/match/${row.matchId}/all` : `/match/${row.matchId}`;

                        return (
                            <tr key={`${row.matchId}-${index}`} className="border-b border-slate-100 last:border-b-0">
                                <td className="px-2 py-2 font-semibold text-slate-500">{index + 1}</td>
                                <td className="px-2 py-2">{new Date(row.matchDate).toLocaleDateString("en-GB")}</td>
                                <td className="px-2 py-2 font-medium text-slate-800">{opponent}</td>
                                <td className="px-2 py-2 text-center font-semibold">
                                    <a href={scoreTarget} className="text-estonia-blue hover:underline">
                                        {row.estoniaSets}-{row.opponentSets}
                                    </a>
                                </td>
                                <td className="px-2 py-2 text-right font-semibold text-estonia-dark">
                                    {row[pointsKey]}
                                </td>
                                <td className="px-2 py-2 text-slate-600">{competition ?? "-"}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function SetsTable({
    rows,
    isEstonian,
    text,
    showDuration = false,
}: {
    rows: TriviaSetRow[];
    isEstonian: boolean;
    text: TriviaText;
    showDuration?: boolean;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-2 py-2">{text.rank}</th>
                        <th className="px-2 py-2">{text.date}</th>
                        <th className="px-2 py-2">{text.opponent}</th>
                        <th className="px-2 py-2 text-center">{text.score}</th>
                        <th className="px-2 py-2 text-center">{text.setScore}</th>
                        {showDuration && <th className="px-2 py-2 text-right">{text.durationMinutes}</th>}
                        <th className="px-2 py-2">{text.competition}</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => {
                        const opponent = isEstonian ? row.opponent : row.opponentEn ?? row.opponent;
                        const competition = isEstonian
                            ? row.competition
                            : row.competitionEn ?? row.competition;
                        const setResultStyle =
                            row.estoniaPoints > row.opponentPoints
                                ? "text-estonia-blue"
                                : row.estoniaPoints === row.opponentPoints
                                    ? "text-green-700"
                                    : "text-red-700";
                        const scoreTarget = row.hasAdditionalSets ? `/match/${row.matchId}/all` : `/match/${row.matchId}`;

                        return (
                            <tr key={`${row.matchId}-${row.setNumber}-${index}`} className="border-b border-slate-100 last:border-b-0">
                                <td className="px-2 py-2 font-semibold text-slate-500">{index + 1}</td>
                                <td className="px-2 py-2">{new Date(row.matchDate).toLocaleDateString("en-GB")}</td>
                                <td className="px-2 py-2 font-medium text-slate-800">{opponent}</td>
                                <td className="px-2 py-2 text-center font-semibold">{row.estoniaSets}-{row.opponentSets}</td>
                                <td className="px-2 py-2 text-center font-semibold">
                                    <a href={scoreTarget} className={`${setResultStyle} hover:underline`}>
                                        {row.estoniaPoints}-{row.opponentPoints}
                                    </a>
                                </td>
                                {showDuration && (
                                    <td className="px-2 py-2 text-right font-semibold text-estonia-dark">
                                        {typeof row.setDuration === "number" ? row.setDuration : "-"}
                                    </td>
                                )}
                                <td className="px-2 py-2 text-slate-600">{competition ?? "-"}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function MatchDurationTable({
    rows,
    isEstonian,
    text,
}: {
    rows: TriviaMatchDurationRow[];
    isEstonian: boolean;
    text: TriviaText;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[740px] border-collapse text-sm">
                <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-2 py-2">{text.rank}</th>
                        <th className="px-2 py-2">{text.date}</th>
                        <th className="px-2 py-2">{text.opponent}</th>
                        <th className="px-2 py-2 text-center">{text.score}</th>
                        <th className="px-2 py-2 text-right">{text.durationMinutes}</th>
                        <th className="px-2 py-2">{text.competition}</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => {
                        const opponent = isEstonian ? row.opponent : row.opponentEn ?? row.opponent;
                        const competition = isEstonian
                            ? row.competition
                            : row.competitionEn ?? row.competition;
                        const scoreTarget = row.hasAdditionalSets ? `/match/${row.matchId}/all` : `/match/${row.matchId}`;

                        return (
                            <tr key={`${row.matchId}-${index}`} className="border-b border-slate-100 last:border-b-0">
                                <td className="px-2 py-2 font-semibold text-slate-500">{index + 1}</td>
                                <td className="px-2 py-2">{new Date(row.matchDate).toLocaleDateString("en-GB")}</td>
                                <td className="px-2 py-2 font-medium text-slate-800">{opponent}</td>
                                <td className="px-2 py-2 text-center font-semibold">
                                    <a href={scoreTarget} className="text-estonia-blue hover:underline">
                                        {row.estoniaSets}-{row.opponentSets}
                                    </a>
                                </td>
                                <td className="px-2 py-2 text-right font-semibold text-estonia-dark">{row.durationMinutes}</td>
                                <td className="px-2 py-2 text-slate-600">{competition ?? "-"}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
