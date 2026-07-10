import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { coachesOptions } from "@/lib/coaches.queries";

export const Route = createFileRoute("/coaches")({
    component: CoachesPage,
});

function CoachesPage() {
    const { t } = useTranslation();
    const { data: coaches } = useSuspenseQuery(
        coachesOptions()
    );

    return (
        <div className="text-slate-900">
            <header className="bg-estonia-dark px-6 py-12 text-white">
                <div className="mx-auto max-w-7xl">
                    <h1 className="font-display text-4xl uppercase italic md:text-5xl">
                        {t("coaches.title")}
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm text-white/60">
                        {t("coaches.subtitle")}
                    </p>

                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                        <StatCard
                            title={t("coaches.headCoaches")}
                            value={coaches.length}
                        />

                        <StatCard
                            title={t("coaches.topCoach")}
                            value={
                                coaches.length > 0
                                    ? coaches[0].allMatches
                                    : 0
                            }
                        />

                        <StatCard
                            title={t("coaches.totalMatches")}
                            value={coaches.reduce(
                                (sum, c) => sum + c.allMatches,
                                0
                            )}
                        />
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-10">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="grid grid-cols-12 gap-3 border-b border-slate-100 bg-slate-50 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <div className="col-span-4">
                            {t("coaches.coach")}
                        </div>

                        <div className="col-span-2 text-center">
                            {t("coaches.competitive")}
                        </div>

                        <div className="col-span-3 text-center">
                            {t("coaches.official")}
                        </div>

                        <div className="col-span-3 text-center">
                            {t("coaches.allMatches")}
                        </div>
                    </div>

                    {coaches.map((coach) => (
                        <div
                            key={coach.coach_id}
                            className="grid grid-cols-12 gap-3 border-t border-slate-100 px-6 py-4"
                        >
                            <div className="col-span-4 flex items-center gap-3">
                                <CoachAvatar
                                    firstName={coach.first_name}
                                    lastName={coach.last_name}
                                />

                                <div>
                                    <div className="font-semibold uppercase">
                                        {coach.first_name}{" "}
                                        {coach.last_name}
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-2 text-center font-medium">
                                {coach.vmMatches}
                                <span className="ml-1 text-slate-500">
                                    ({coach.vmWinPct}%)
                                </span>
                            </div>

                            <div className="col-span-3 text-center font-medium">
                                {coach.amMatches}
                                <span className="ml-1 text-slate-500">
                                    ({coach.amWinPct}%)
                                </span>
                            </div>

                            <div className="col-span-3 text-center font-medium">
                                {coach.allMatches}
                                <span className="ml-1 text-slate-500">
                                    ({coach.allWinPct}%)
                                </span>
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
}: {
    firstName: string;
    lastName: string;
}) {
    return (
        <div className="grid h-10 w-10 place-items-center rounded-full bg-estonia-dark text-sm font-bold text-white">
            {firstName[0]}
            {lastName[0]}
        </div>
    );
}

function StatCard({
    title,
    value,
}: {
    title: string;
    value: number;
}) {
    return (
        <div className="rounded-lg border border-white/20 bg-white/5 p-4">
            <div className="text-center text-[10px] uppercase tracking-[0.2em] text-white/60">
                {title}
            </div>

            <div className="mt-2 text-center font-display text-3xl">
                {value}
            </div>
        </div>
    );
}