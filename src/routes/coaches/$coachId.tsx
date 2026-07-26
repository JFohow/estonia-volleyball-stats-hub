import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { coachOptions, type CoachPageData } from "@/lib/coaches.queries";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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

    const formatDate = (dateString: string | null): string => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    const getMatchType = (match: typeof matches[0]): string => {
        if (match.vm) return "VM";
        if (match.am) return "AM";
        if (match.mam) return "MAM";
        return "-";
    };

    const getMatchTypeColor = (matchType: string): string => {
        switch (matchType) {
            case "VM":
                return "bg-blue-100 text-blue-800";
            case "AM":
                return "bg-green-100 text-green-800";
            case "MAM":
                return "bg-amber-100 text-amber-800";
            default:
                return "bg-slate-100 text-slate-800";
        }
    };

    const birthCountry = i18n.language?.startsWith("et") && coach.birth_country === "Estonia" ? "Eesti" : coach.birth_country;

    return (
        <div className="text-slate-900">
            <div className="mx-auto max-w-6xl px-6 py-10">
                {/* Coach Header Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm mb-8">
                    <div className="flex gap-8">
                        {/* Photo */}
                        <div className="flex-shrink-0">
                            {coach.photo_url ? (
                                <img
                                    src={coach.photo_url}
                                    alt={`${coach.first_name} ${coach.last_name}`}
                                    className="h-48 w-48 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="h-48 w-48 rounded-lg bg-slate-200 flex items-center justify-center">
                                    <span className="text-2xl">🏐</span>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold text-slate-900">
                                {coach.first_name} {coach.last_name}
                            </h1>

                            <div className="mt-8 grid grid-cols-2 gap-6">
                                {/* Date of Birth */}
                                <div>
                                    <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                                        {t("players.dateOfBirth") || "Date of Birth"}
                                    </p>
                                    <p className="mt-1 text-lg text-slate-900">
                                        {formatDate(coach.birth_date)}
                                    </p>
                                </div>

                                {/* From (Birth Country) */}
                                <div>
                                    <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                                        {t("players.from") || "From"}
                                    </p>
                                    <p className="mt-1 text-lg text-slate-900">
                                        {birthCountry || "-"}
                                    </p>
                                </div>

                                {/* Debut */}
                                <div>
                                    <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                                        {t("coaches.debut") || "Debut"}
                                    </p>
                                    <p className="mt-1 text-lg text-slate-900">
                                        {formatDate(coach.debut_date)}
                                    </p>
                                </div>

                                {/* Last Game */}
                                <div>
                                    <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                                        {t("coaches.lastGame") || "Last Game"}
                                    </p>
                                    <p className="mt-1 text-lg text-slate-900">
                                        {formatDate(lastMatchDate)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Match History */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-slate-200 px-8 py-4">
                        <h2 className="text-2xl font-bold text-slate-900">
                            {t("coaches.matchHistory") || "Match History"}
                        </h2>
                    </div>

                    {matches && matches.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-left">{t("matches.date") || "Date"}</TableHead>
                                    <TableHead className="text-left">{t("matches.opponent") || "Opponent"}</TableHead>
                                    <TableHead className="text-left">{t("matches.competition") || "Competition"}</TableHead>
                                    <TableHead className="text-center">{t("matches.score") || "Score"}</TableHead>
                                    <TableHead className="text-center">Type</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {matches.map((match) => (
                                    <TableRow key={match.match_id}>
                                        <TableCell className="text-sm text-slate-600">
                                            {formatDate(match.match_date)}
                                        </TableCell>
                                        <TableCell className="text-sm font-medium text-slate-900">
                                            {match.opponent}
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">
                                            {match.competition || "-"}
                                        </TableCell>
                                        <TableCell className="text-center text-sm font-semibold">
                                            <a
                                                href={`/match/${match.match_id}`}
                                                className="text-estonia-blue hover:underline"
                                            >
                                                {match.estonia_sets}–{match.opponent_sets}
                                            </a>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={getMatchTypeColor(getMatchType(match))}>
                                                {getMatchType(match)}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="px-8 py-12 text-center text-slate-600">
                            {t("coaches.noMatches") || "No matches found"}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
