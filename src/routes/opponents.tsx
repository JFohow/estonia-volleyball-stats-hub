import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/opponents")({
  head: () => ({
    meta: [
      { title: "Opponents — Estonia Men's Volleyball Archive" },
      {
        name: "description",
        content:
          "Head-to-head records between Estonia and every national team it has faced.",
      },
    ],
  }),
  component: () => (
    <ComingSoon
      title="Opponent Records"
      description="Head-to-head records against every national team Estonia has ever faced, grouped by decade and competition."
    />
  ),
});
