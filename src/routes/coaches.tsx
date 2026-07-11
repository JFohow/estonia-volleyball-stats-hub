import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { coachesOptions } from "@/lib/coaches.queries";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/coaches")({
    component: CoachesPage,
});



function CoachesPage() {
    const { t } = useTranslation();

    const { data: coaches } = useSuspenseQuery(
        coachesOptions()
    );

    function SortIcon(field: string) {
        if (sortField !== field) {
            return " ⇅";
        }

        return sortDirection === "asc"
            ? " ↑"
            : " ↓";
    }

    const [sortField, setSortField] = useState<
        | "amMatches"
        | "amWinPct"
        | "vmMatches"
        | "vmWinPct"
        | "allMatches"
        | "allWinPct"
    >("amMatches");

    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

    const sortedCoaches = [...coaches].sort((a, b) => {
        const aValue = Number(a[sortField]);
        const bValue = Number(b[sortField]);

        if (sortDirection === "asc") {
            return aValue - bValue;
        }

        return bValue - aValue;
    });



    function handleSort(
        field:
            | "amMatches"
            | "amWinPct"
            | "vmMatches"
            | "vmWinPct"
            | "allMatches"
            | "allWinPct"
    ) {
        if (sortField === field) {
            setSortDirection(
                sortDirection === "asc" ? "desc" : "asc"
            );
        } else {
            setSortField(field);
            setSortDirection("desc");
        }
    }

    return (
        <div className="text-slate-900">
            <header className="bg-estonia-dark px-6 py-12 text-white">
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <h1 className="font-display text-4xl uppercase italic md:text-5xl">
                                {t("coaches.title")}
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm text-white/60">
                                {t("coaches.subtitle")}
                            </p>
                        </div>

                        <div className="w-full max-w-xl">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                                <p className="text-xs leading-relaxed text-white/75">
                                    {t("common.databaseExplanation")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-10">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                    {/* Group Header */}
                    <div className="border-b border-slate-200 bg-slate-50">

                        <div className="grid grid-cols-16 px-6 pt-4 text-[10px] font-bold uppercase tracking-widest">
                            <div className="col-span-4" />

                            <div className="col-span-4 text-center text-estonia-dark">
                                {t("coaches.official")}
                            </div>

                            <div className="col-span-4 text-center text-slate-500">
                                {t("coaches.competitive")}
                            </div>

                            <div className="col-span-4 text-center text-slate-500">
                                {t("coaches.allMatches")}
                            </div>
                        </div>

                        <div className="grid grid-cols-16 gap-3 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            <div className="col-span-4">

                            </div>

                            <button
                                onClick={() => handleSort("amMatches")}
                                className={`col-span-2 text-center uppercase tracking-widest transition-colors hover:text-estonia-blue ${sortField === "amMatches"
                                    ? "text-estonia-blue"
                                    : ""
                                    }`}
                            >
                                {t("common.matches")}
                                {SortIcon("amMatches")}
                            </button>

                            <button
                                onClick={() => handleSort("amWinPct")}
                                className={`col-span-2 text-center uppercase tracking-widest transition-colors hover:text-estonia-blue ${sortField === "amWinPct"
                                    ? "text-estonia-blue"
                                    : ""
                                    }`}
                            >
                                {t("coaches.winPct")}
                                {SortIcon("amWinPct")}
                            </button>

                            <button
                                onClick={() => handleSort("vmMatches")}
                                className={`col-span-2 text-center uppercase tracking-widest transition-colors hover:text-estonia-blue ${sortField === "vmMatches"
                                    ? "text-estonia-blue"
                                    : ""
                                    }`}
                            >
                                {t("common.matches")}
                                {SortIcon("vmMatches")}
                            </button>

                            <button
                                onClick={() => handleSort("vmWinPct")}
                                className={`col-span-2 text-center uppercase tracking-widest transition-colors hover:text-estonia-blue ${sortField === "vmWinPct"
                                    ? "text-estonia-blue"
                                    : ""
                                    }`}
                            >
                                {t("coaches.winPct")}
                                {SortIcon("vmWinPct")}
                            </button>

                            <button
                                onClick={() => handleSort("allMatches")}
                                className={`col-span-2 text-center uppercase tracking-widest transition-colors hover:text-estonia-blue ${sortField === "allMatches"
                                    ? "text-estonia-blue"
                                    : ""
                                    }`}
                            >
                                {t("common.matches")}
                                {SortIcon("allMatches")}
                            </button>

                            <button
                                onClick={() => handleSort("allWinPct")}
                                className={`col-span-2 text-center uppercase tracking-widest transition-colors hover:text-estonia-blue ${sortField === "allWinPct"
                                    ? "text-estonia-blue"
                                    : ""
                                    }`}
                            >
                                {t("coaches.winPct")}
                                {SortIcon("allWinPct")}
                            </button>
                        </div>
                    </div>

                    {/* Coach Rows */}
                    {sortedCoaches.map((coach) => (
                        <div
                            key={coach.coach_id}
                            className="grid grid-cols-16 gap-3 border-t border-slate-100 px-6 py-4 hover:bg-slate-50"
                        >
                            <div className="col-span-4 flex items-center gap-3">
                                <CoachAvatar
                                    firstName={coach.first_name}
                                    lastName={coach.last_name}
                                    photoUrl={coach.photo_url}
                                />

                                <Link
                                    to="/coaches/$coachId"
                                    params={{
                                        coachId: String(coach.coach_id),
                                    }}
                                    className="font-semibold uppercase transition-colors hover:text-estonia-blue"
                                >
                                    {coach.first_name} {coach.last_name}
                                </Link>
                            </div>

                            <div className="col-span-2 text-center">
                                <span className="font-semibold text-estonia-dark">
                                    {coach.amMatches}
                                </span>
                            </div>

                            <div className="col-span-2 text-center text-slate-500">
                                {coach.amWinPct}%
                            </div>

                            <div className="col-span-2 text-center">
                                <span className="font-semibold text-estonia-dark">
                                    {coach.vmMatches}
                                </span>
                            </div>

                            <div className="col-span-2 text-center text-slate-500">
                                {coach.vmWinPct}%
                            </div>

                            <div className="col-span-2 text-center">
                                <span className="font-semibold text-estonia-dark">
                                    {coach.allMatches}
                                </span>
                            </div>

                            <div className="col-span-2 text-center text-slate-500">
                                {coach.allWinPct}%
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}

function CoachAvatar({
    firstName,
    lastName,
    photoUrl,
}: {
    firstName: string;
    lastName: string;
    photoUrl: string | null;
}) {
    if (photoUrl) {
        return (
            <img
                src={photoUrl}
                alt={`${firstName} ${lastName}`}
                className="h-10 w-10 rounded-full object-cover"
            />
        );
    }

    return (
        <div className="grid h-10 w-10 place-items-center rounded-full bg-estonia-dark text-sm font-bold text-white">
            {firstName[0]}
            {lastName[0]}
        </div>
    );
}