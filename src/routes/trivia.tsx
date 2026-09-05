import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { type ReactNode } from "react";
import {
    triviaOptions,
    type TriviaCityRow,
    type TriviaMatchTotalRow,
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
    title: string;
    subtitle: string;
    rank: string;
    city: string;
    matches: string;
    date: string;
    opponent: string;
    score: string;
    competition: string;
    totalPoints: string;
    setScore: string;
    futureTitle: string;
    futureItems: string[];
    sections: {
        topCities: string;
        topAbroadCities: string;
        leastEstPoints: string;
        leastOppPoints: string;
        mostEstPoints: string;
        mostOppPoints: string;
        highestScoringSets: string;
        lowestScoringSets: string;
    };
};

function TriviaPage() {
    const { data } = useSuspenseQuery(triviaOptions());
    const { i18n } = useTranslation();

    const isEstonian = i18n.language?.startsWith("et") ?? false;

    const text: TriviaText = isEstonian
        ? {
            title: "TRIVIA",
            subtitle: "Juhuslikud Top 10 statistikanurgad andmebaasist.",
            rank: "#",
            city: "Linn",
            matches: "Mange",
            date: "Kuupaev",
            opponent: "Vastane",
            score: "Skor",
            competition: "Voistlus",
            totalPoints: "Punktid kokku",
            setScore: "Geimi skoor",
            futureTitle: "Tulevikus (praegu ei saa arvutada)",
            futureItems: [
                "Pikimad geimid (aeg)",
                "Luhimad geimid (aeg)",
                "Pikim mang (aeg)",
                "Luhim mang (aeg)",
            ],
            sections: {
                topCities: "Linnad, kus Eesti on koige rohkem manginud",
                leastEstPoints: "Mangud koige vahemate Eesti punktidega",
                leastOppPoints: "Mangud koige vahemate vastase punktidega",
                mostEstPoints: "Mangud koige rohkemate Eesti punktidega",
                mostOppPoints: "Mangud koige rohkemate vastase punktidega",
                highestScoringSets: "Koige suurema punktisummaga geimid",
                topAbroadCities: "Linnad, kus Eesti on valismaal koige rohkem manginud",
                lowestScoringSets: "Koige vaiksema punktisummaga geimid",
            },
        }
        : {
            title: "TRIVIA",
            subtitle: "Random Top 10 statistical slices from the database.",
            rank: "#",
            city: "City",
            matches: "Matches",
            date: "Date",
            opponent: "Opponent",
            score: "Score",
            competition: "Competition",
            totalPoints: "Total Points",
            setScore: "Set Score",
            futureTitle: "Future (not calculable yet)",
            futureItems: [
                "Longest Sets (time)",
                "Shortest Sets (time)",
                "Longest Match (time)",
                "Shortest Match (time)",
            ],
            sections: {
                topCities: "Cities where Estonia has played the most",
                topAbroadCities: "Cities where Estonia has played the most abroad",
                leastEstPoints: "Matches with least Estonia points",
                leastOppPoints: "Matches with least opponent points",
                mostEstPoints: "Matches with most Estonia points",
                mostOppPoints: "Matches with most opponent points",
                highestScoringSets: "Highest scoring sets",
                lowestScoringSets: "Lowest scoring sets",
            },
        };

    const sections: Section[] = [
        {
            key: "topCities",
            title: text.sections.topCities,
            content: <CitiesTable rows={data.topCities} isEstonian={isEstonian} text={text} />,
        },
        {
            key: "topAbroadCities",
            title: text.sections.topAbroadCities,
            content: <CitiesTable rows={data.topAbroadCities} isEstonian={isEstonian} text={text} />,
        },
        {
            key: "leastEstPoints",
            title: text.sections.leastEstPoints,
            content: <MatchPointsTable rows={data.leastEstoniaPointsMatches} isEstonian={isEstonian} text={text} />,
        },
        {
            key: "leastOppPoints",
            title: text.sections.leastOppPoints,
            content: <MatchPointsTable rows={data.leastOpponentPointsMatches} isEstonian={isEstonian} text={text} />,
        },
        {
            key: "mostEstPoints",
            title: text.sections.mostEstPoints,
            content: <MatchPointsTable rows={data.mostEstoniaPointsMatches} isEstonian={isEstonian} text={text} />,
        },
        {
            key: "mostOppPoints",
            title: text.sections.mostOppPoints,
            content: <MatchPointsTable rows={data.mostOpponentPointsMatches} isEstonian={isEstonian} text={text} />,
        },
        {
            key: "highestScoringSets",
            title: text.sections.highestScoringSets,
            content: <SetsTable rows={data.highestScoringSets} isEstonian={isEstonian} text={text} />,
        },
        {
            key: "lowestScoringSets",
            title: text.sections.lowestScoringSets,
            content: <SetsTable rows={data.lowestScoringSets} isEstonian={isEstonian} text={text} />,
        },
    ];

    return (
        <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 sm:py-10 lg:px-14">
            <header className="relative overflow-hidden rounded-3xl border border-sky-100 bg-[radial-gradient(circle_at_top_left,_#dbeafe_0%,_#f8fafc_42%,_#e2e8f0_100%)] px-6 py-8 shadow-sm md:px-10 md:py-10">
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-estonia-blue/20 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-10 h-52 w-52 rounded-full bg-slate-300/35 blur-2xl" />
                <h1 className="relative font-display text-4xl uppercase italic text-estonia-dark sm:text-5xl">
                    {text.title}
                </h1>
                <p className="relative mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">{text.subtitle}</p>
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

            <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <h2 className="font-display text-2xl uppercase italic text-slate-900">{text.futureTitle}</h2>
                <ul className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    {text.futureItems.map((item) => (
                        <li key={item} className="rounded-md border border-slate-200 bg-white px-3 py-2">
                            {item}
                        </li>
                    ))}
                </ul>
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
}: {
    rows: TriviaMatchTotalRow[];
    isEstonian: boolean;
    text: TriviaText;
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
                        <th className="px-2 py-2 text-right">{text.totalPoints}</th>
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
                                <td className="px-2 py-2 text-right font-semibold text-estonia-dark">{row.totalPoints}</td>
                                <td className="px-2 py-2 text-slate-600">{competition ?? "-"}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function SetsTable({ rows, isEstonian, text }: { rows: TriviaSetRow[]; isEstonian: boolean; text: TriviaText }) {
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
                        <th className="px-2 py-2">{text.competition}</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => {
                        const opponent = isEstonian ? row.opponent : row.opponentEn ?? row.opponent;
                        const competition = isEstonian
                            ? row.competition
                            : row.competitionEn ?? row.competition;

                        return (
                            <tr key={`${row.matchId}-${row.setNumber}-${index}`} className="border-b border-slate-100 last:border-b-0">
                                <td className="px-2 py-2 font-semibold text-slate-500">{index + 1}</td>
                                <td className="px-2 py-2">{new Date(row.matchDate).toLocaleDateString("en-GB")}</td>
                                <td className="px-2 py-2 font-medium text-slate-800">{opponent}</td>
                                <td className="px-2 py-2 text-center font-semibold">{row.estoniaSets}-{row.opponentSets}</td>
                                <td className="px-2 py-2 text-center">{row.estoniaPoints}-{row.opponentPoints}</td>
                                <td className="px-2 py-2 text-slate-600">{competition ?? "-"}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
