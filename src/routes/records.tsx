import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/records")({
  component: RecordsPage,
});

function recordsOptions() {
  return queryOptions({
    queryKey: ["records"],
    queryFn: async () => {
      const { data } = await supabase
        .from("player_career_totals")
        .select("*");

      return data ?? [];
    },
  });
}

function leader<T>(
  arr: T[],
  selector: (item: T) => number
) {
  return [...arr].sort(
    (a, b) => selector(b) - selector(a)
  )[0];
}

function RecordsPage() {
  const { data } = useSuspenseQuery(recordsOptions());

  const appearances = leader(data, p => p.appearances);
  const setsPlayed = leader(data, p => p.sets_played);
  const setsStarted = leader(data, p => p.sets_started);
  const captaincies = leader(data, p => p.captaincies);
  const points = leader(data, p => p.points);
  const aces = leader(data, p => p.aces);
  const blocks = leader(data, p => p.blocks);

  const cards = [
    {
      title: "Most Appearances",
      player: appearances,
      value: appearances?.appearances,
    },
    {
      title: "Most Sets Played",
      player: setsPlayed,
      value: setsPlayed?.sets_played,
    },
    {
      title: "Most Sets Started",
      player: setsStarted,
      value: setsStarted?.sets_started,
    },
    {
      title: "Most Captaincies",
      player: captaincies,
      value: captaincies?.captaincies,
    },
    {
      title: "Most Points",
      player: points,
      value: points?.points,
    },
    {
      title: "Most Aces",
      player: aces,
      value: aces?.aces,
    },
    {
      title: "Most Blocks",
      player: blocks,
      value: blocks?.blocks,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="font-display text-5xl uppercase italic">
        Records
      </h1>

      <p className="mt-2 text-slate-500">
        All-time Estonia Men's National Team leaders.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="text-xs uppercase tracking-widest text-estonia-blue">
              {card.title}
            </div>

            <div className="mt-4 text-2xl font-bold">
              {card.player
                ? `${card.player.first_name} ${card.player.last_name}`
                : "—"}
            </div>

            <div className="mt-2 font-display text-5xl">
              {card.value?.toLocaleString() ?? "0"}
            </div>

            <div className="mt-2 text-sm text-slate-500">
              {card.player?.position ?? ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}