import { Link } from "@tanstack/react-router";

export function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 bg-estonia-dark text-white shadow-lg">
      <div className="flex items-center px-6 py-4">
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
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-white/5 bg-slate-900 px-6 py-12 text-slate-500">
      <div className="mx-auto max-w-7xl">
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
        <p className="mt-4 max-w-xs text-xs">
          The historical statistical repository for the Estonia Men's National Volleyball Team.
        </p>
      </div>
    </footer>
  );
}
