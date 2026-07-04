import { Link } from "@tanstack/react-router";
import { MatchTypeFilterBar } from "@/lib/match-filter";

const links = [
  { to: "/matches", label: "Matches" },
  { to: "/players", label: "Players" },
  { to: "/opponents", label: "Opponents" },
  { to: "/records", label: "Records" },
  { to: "/statistics", label: "Statistics" },
] as const;

export function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 bg-estonia-dark text-white shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-5 w-8 flex-col overflow-hidden rounded-sm">
              <div className="flex-1 bg-estonia-blue" />
              <div className="flex-1 bg-black" />
              <div className="flex-1 bg-white" />
            </div>
            <span className="font-display text-2xl uppercase tracking-tight">
              Eesti Võrkpall <span className="font-light opacity-70">DB</span>
            </span>
          </Link>
          <div className="hidden gap-6 text-sm font-medium uppercase tracking-wide opacity-80 md:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="transition-colors hover:text-estonia-blue"
                activeProps={{ className: "text-estonia-blue" }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <MatchTypeFilterBar />
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-white/5 bg-slate-900 px-6 py-12 text-slate-500">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-4 w-6 flex-col overflow-hidden rounded-sm">
              <div className="flex-1 bg-estonia-blue" />
              <div className="flex-1 bg-black" />
              <div className="flex-1 bg-white" />
            </div>
            <span className="font-display text-lg uppercase tracking-tight text-white">
              Eesti Võrkpall DB
            </span>
          </div>
          <p className="max-w-xs text-xs">
            The historical statistical repository for the Estonia Men's National Volleyball Team.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-12">
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-white">Database</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/matches" className="hover:text-white">Match archive</Link></li>
              <li><Link to="/players" className="hover:text-white">Player index</Link></li>
              <li><Link to="/opponents" className="hover:text-white">Opponents</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-white">Statistics</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/records" className="hover:text-white">All-time records</Link></li>
              <li><Link to="/statistics" className="hover:text-white">Data coverage</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
