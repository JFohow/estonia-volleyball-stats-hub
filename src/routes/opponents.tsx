import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/opponents")({
  component: OpponentsPage,
});

function opponentsOptions() {
  return queryOptions({
    queryKey: ["opponents"],

    queryFn: async () => {
      const { data: matches } = await supabase
        .from("matches")
        .select(
          `
          match_id,
          opponent,
          estonia_sets,
          opponent_sets
        `
        );

      const opponents = new Map<
        string,
        {
          matches: number;
          wins: number;
          losses: number;
          setsWon: number;
          setsLost: number;
        }
      >();

      for (const match of matches ?? []) {
        if (!match.opponent) continue;

        const current = opponents.get(match.opponent) ?? {
          matches: 0,
          wins: 0,
          losses: 0,
          setsWon: 0,
          setsLost: 0,
        };

        current.matches += 1;
        current.setsWon += match.estonia_sets ?? 0;
        current.setsLost += match.opponent_sets ?? 0;

        if (
          (match.estonia_sets ?? 0) >
          (match.opponent_sets ?? 0)
        ) {
          current.wins += 1;
        } else if (
          (match.estonia_sets ?? 0) <
          (match.opponent_sets ?? 0)
        ) {
          current.losses += 1;
        }

        opponents.set(match.opponent, current);
      }

      return [...opponents.entries()]
        .map(([opponent, stats]) => ({
          opponent,
          ...stats,
          winPct:
            stats.matches > 0
              ? Math.round(
                (stats.wins / stats.matches) * 100
              )
              : 0,
        }))
        .sort((a, b) => b.matches - a.matches);
    },
  });
}

function OpponentsPage() {
  const { data } = useSuspenseQuery(
    opponentsOptions()
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="font-display text-5xl uppercase italic">
        Opponents
      </h1>

      <p className="mt-2 text-slate-500">
        Estonia Men's National Team head-to-head
        record against every opponent.
      </p>

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 text-left">Opponent</th>
              <th className="p-4 text-left">Matches</th>
              <th className="p-4 text-left">Wins</th>
              <th className="p-4 text-left">Losses</th>
              <th className="p-4 text-left">Sets</th>
              <th className="p-4 text-left">Win %</th>
            </tr>
          </thead>

          <tbody>
            {data.map((opponent) => (
              <tr
                key={opponent.opponent}
                className="border-t border-slate-100"
              >
                <td className="p-4 font-medium">
                  <Link
                    to="/opponents/$opponent"
                    params={{
                      opponent: opponent.opponent,
                    }}
                    className="hover:text-estonia-blue"
                  >
                    {opponent.opponent}
                  </Link>
                </td>

                <td className="p-4">
                  {opponent.matches}
                </td>

                <td className="p-4 text-green-600">
                  {opponent.wins}
                </td>

                <td className="p-4 text-red-500">
                  {opponent.losses}
                </td>

                <td className="p-4">
                  {opponent.setsWon}-
                  {opponent.setsLost}
                </td>

                <td className="p-4 font-semibold">
                  {opponent.winPct}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}