import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { playerOptions } from "@/lib/players.queries";
import { useTranslation } from "react-i18next";


export const Route = createFileRoute("/players/$playerId")({
    component: PlayerPage,
});

function PlayerPage() {
    const { playerId } = Route.useParams();

    const { t } = useTranslation();

    const { data } = useSuspenseQuery(
        playerOptions(Number(playerId))
    );

    const player = data.player;
    const appearances = data.appearances;

    const sortedAppearances = [...appearances].sort(
        (a, b) =>
            new Date(a.matches.match_date).getTime() -
            new Date(b.matches.match_date).getTime()
    );

    const debutMatch =
        sortedAppearances[0] ?? null;

    const lastMatch =
        sortedAppearances[
        sortedAppearances.length - 1
        ] ?? null;

    const shirtNumbers = [
        ...new Set(
            appearances
                .map((a) => a.shirt_number)
                .filter(Boolean)
        ),
    ].sort((a, b) => Number(a) - Number(b));

    const amApps = appearances.filter(
        (a) => a.matches?.am
    ).length;

    const age = player.birth_date
        ? Math.floor(
            (Date.now() -
                new Date(player.birth_date).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        )
        : null;

    const positionLabels: Record<string, string> = {
        SET: "Setter",
        OPP: "Opposite",
        OH: "Outside Hitter",
        MB: "Middle Blocker",
        LIB: "Libero",
    };

    return (
        <div>
            <header className="bg-estonia-dark px-6 py-12 text-white">
                <div className="mx-auto max-w-7xl">
                    <div className="grid gap-8 lg:grid-cols-[220px_260px_260px_340px]">
                        <img
                            src={
                                player.photo_url ??
                                `https://lrdblxldprvfylcyoxvb.supabase.co/storage/v1/object/public/player-photos/${player.player_id}.jpg`
                            }
                            alt={`${player.first_name} ${player.last_name}`}
                            className="h-63 w-48 rounded-2xl border-2 border-white/20 object-cover"
                        />
                        <div className="col-span-2">

                            <h1 className="font-display text-5xl uppercase italic">
                                {player.first_name} {player.last_name}
                            </h1>

                            <div className="mt-8 grid gap-x-16 gap-y-4 text-white/80 md:grid-cols-2">

                                <div className="space-y-5">

                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-white/50">
                                            {t("players.position")}
                                        </div>
                                        <div className="mt-1">
                                            🏐 {
                                                positionLabels[player.position ?? ""] ??
                                                player.position ??
                                                "N/A"
                                            }
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-white/50">
                                            {t("players.height")}
                                        </div>
                                        <div className="mt-1">
                                            📏 {
                                                player.height_cm
                                                    ? `${player.height_cm} cm`
                                                    : "N/A"
                                            }
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-white/50">
                                            {t("players.birth_date")}
                                        </div>
                                        <div className="mt-1">
                                            🎂 {
                                                player.birth_date
                                                    ? new Date(
                                                        player.birth_date
                                                    ).toLocaleDateString("en-GB")
                                                    : "N/A"
                                            }
                                            {age ? ` (${age})` : ""}
                                        </div>
                                    </div>

                                </div>

                                <div className="space-y-5">

                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-white/50">
                                            {t("players.place_of_birth")}
                                        </div>
                                        <div className="mt-1">
                                            📍 {player.place_of_birth ?? "N/A"}
                                            {player.birth_county
                                                ? `, ${player.birth_county}`
                                                : ""}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-white/50">
                                            {t("players.handedness")}
                                        </div>
                                        <div className="mt-1">
                                            ✋ {player.handedness ?? "N/A"}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-white/50">
                                            {t("players.shirt_numbers")}
                                        </div>
                                        <div className="mt-1">
                                            👕 {
                                                shirtNumbers.length > 0
                                                    ? shirtNumbers.join(", ")
                                                    : "N/A"
                                            }
                                        </div>
                                    </div>

                                </div>

                            </div>

                        </div>

                        <div className="space-y-4">

                            <InfoCard
                                title={t("players.national_team_debut")}
                                date={debutMatch?.matches.match_date}
                                opponent={debutMatch?.matches.opponent}
                                competition={debutMatch?.matches.competition}
                            />

                            <InfoCard
                                title={t("players.last_match")}
                                date={lastMatch?.matches.match_date}
                                opponent={lastMatch?.matches.opponent}
                                competition={lastMatch?.matches.competition}
                            />
                        </div>
                    </div>
                </div>
            </header >

            <main className="mx-auto max-w-7xl px-6 py-10">
                <h2 className="mb-6 font-display text-3xl uppercase italic">
                    Match History
                </h2>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="grid grid-cols-12 gap-3 border-b border-slate-100 bg-slate-50 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <div className="col-span-2">Date</div>
                        <div className="col-span-3">Opponent</div>
                        <div className="col-span-2 text-center">Score</div>
                        <div className="col-span-4">Competition</div>
                        <div className="col-span-1 text-center">Sets</div>
                    </div>

                    {appearances.map((a) => (
                        <div
                            key={a.appearance_id}
                            className="grid grid-cols-12 gap-3 border-t border-slate-100 px-6 py-4"
                        >
                            <div className="col-span-2">
                                {new Date(
                                    a.matches.match_date
                                ).toLocaleDateString("en-GB")}
                            </div>

                            <div className="col-span-3">
                                {a.matches.opponent}
                            </div>

                            <div className="col-span-2 text-center">
                                {a.matches.estonia_sets}–
                                {a.matches.opponent_sets}
                            </div>

                            <div className="col-span-4">
                                {a.matches.competition}
                            </div>

                            <div className="col-span-1 text-center">
                                {a.sets_played}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div >
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
function InfoCard({
    title,
    date,
    opponent,
    competition,
}: {
    title: string;
    date?: string;
    opponent?: string;
    competition?: string;
}) {
    return (
        <div className="rounded-lg border border-white/20 bg-white/5 p-3">
            <div className="text-center text-[12px] uppercase tracking-[0.2em] text-white/60">
                {title}
            </div>

            <div className="mt-2 text-center">
                <div className="font-semibold">
                    {date
                        ? new Date(date).toLocaleDateString("en-GB")
                        : "N/A"}
                </div>

                <div className="mt-1 text-sm text-white/80">
                    {opponent
                        ? `vs ${opponent}`
                        : "N/A"}
                </div>

                <div className="mt-1 text-xs text-white/60">
                    {competition ?? "N/A"}
                </div>
            </div>
        </div>
    );
}
