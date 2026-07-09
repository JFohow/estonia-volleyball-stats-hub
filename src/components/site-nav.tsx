import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

export function SiteNav() {
  const { t } = useTranslation();
  return (
    <nav className="sticky top-0 z-50 bg-estonia-dark text-white shadow-lg">
      <div className="flex items-center gap-8 px-6 py-4">
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
        <div className="flex gap-6 text-sm font-medium uppercase tracking-wide opacity-80">
          <Link
            to="/"
            className="transition-colors hover:text-estonia-blue"
            activeProps={{ className: "text-estonia-blue" }}
            activeOptions={{ exact: true }}
          >
            {t("nav.home")}
          </Link>

          <Link
            to="/matches"
            className="transition-colors hover:text-estonia-blue"
            activeProps={{ className: "text-estonia-blue" }}
          >
            {t("nav.matches")}
          </Link>

          <Link
            to="/players"
            className="transition-colors hover:text-estonia-blue"
            activeProps={{ className: "text-estonia-blue" }}
          >
            {t("nav.players")}
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-2 py-1">
          <button
            onClick={() => i18n.changeLanguage("en")}
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs transition ${i18n.language === "en"
                ? "bg-estonia-blue text-white"
                : "hover:bg-white/10"
              }`}
          >
            🇬🇧 EN
          </button>

          <button
            onClick={() => i18n.changeLanguage("et")}
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs transition ${i18n.language === "et"
                ? "bg-estonia-blue text-white"
                : "hover:bg-white/10"
              }`}
          >
            🇪🇪 ET
          </button>
        </div>
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
