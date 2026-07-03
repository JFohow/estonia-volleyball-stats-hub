import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";

export const Route = createFileRoute("/players")({
  component: PlayersPage,
});

function playersOptions() {
  return queryOptions({
    queryKey: ["players-page"],
    queryFn: async () => {
      const [{ data: players }, { data: appearances }] =
        await Promise.all([
          supabase
            .from("players")
            .select("*")
            .order("last_name"),

          supabase
            .from("appearances")
            .select("player_id, sets_played, captain"),
        ]);

      const stats = new Map<
        number,
        {
          appearances: number;
          sets: number;
          captaincies: number;
        }
      >();

      appearances?.forEach((a) => {
        const current = stats.get(a.player_id) ?? {
          appearances: 0,
          sets: 0,
          captaincies: 0,
        };

        current.appearances += 1;
        current.sets += a.sets_played ?? 0;

        if (a.captain) {
          current.captaincies += 1;
        }

        stats.set(a.player_id, current);
      });

      return {
        players: (players ?? []).map((p) => ({
          ...p,
          appearances: stats.get(p.player_id)?.appearances ?? 0,
          setsPlayed: stats.get(p.player_id)?.sets ?? 0,
          captaincies: stats.get(p.player_id)?.captaincies ?? 0,
        })),
      };
    },
  });
}

function PlayersPage() {
  const { data } = useSuspenseQuery(playersOptions());

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="font-display text-4xl uppercase italic">
        Players
      </h1>

      <p className="mt-2 text-slate-500">
        All Estonia Men's National Team players.
      </p>

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 text-left">Player</th>
              <th className="p-4 text-left">Position</th>
              <th className="p-4 text-left">Appearances</th>
              <th className="p-4 text-left">Sets Played</th>
              <th className="p-4 text-left">Captaincies</th>
            </tr>
          </thead>

          <tbody>
            {data.players.map((player) => (
              <tr
                key={player.player_id}
                className="border-t border-slate-100"
              >
                <td className="p-4">
                  <Link
                    to="/player/$playerId"
                    params={{
                      playerId: String(player.player_id),
                    }}
                    className="font-medium hover:text-estonia-blue"
                  >
                    {player.first_name} {player.last_name}
                  </Link>
                </td>

                <td className="p-4">
                  {player.position ?? "—"}
                </td>

                <td className="p-4">
                  {player.appearances}
                </td>

                <td className="p-4">
                  {player.setsPlayed}
                </td>

                <td className="p-4">
                  {player.captaincies}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}