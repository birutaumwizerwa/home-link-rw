import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ImigongoBand } from "@/components/brand/Imigongo";
import { Logo } from "@/components/brand/Logo";
import { CONTACT_EMAIL, SUPPORT_WHATSAPP } from "@/lib/constants";

export function Footer() {
  const { t } = useTranslation();
  const linkClass = "hover:text-white";
  return (
    <footer className="mt-16 bg-ink text-white/75">
      <ImigongoBand />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo tone="light" />
            <p className="mt-3 max-w-xs text-sm">{t("footer.tagline")}</p>
          </div>
          <div>
            <h2 className="mb-3 font-sans text-sm font-semibold tracking-normal text-white">
              {t("footer.find")}
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/search" search={{ type: "rent" }} className={linkClass}>
                  {t("home.filterRent")}
                </Link>
              </li>
              <li>
                <Link to="/search" search={{ type: "sale" }} className={linkClass}>
                  {t("home.filterSale")}
                </Link>
              </li>
              <li>
                <Link to="/neighbourhoods" className={linkClass}>
                  {t("nav.neighbourhoods")}
                </Link>
              </li>
              <li>
                <Link to="/guide" className={linkClass}>
                  {t("nav.guide")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="mb-3 font-sans text-sm font-semibold tracking-normal text-white">
              {t("footer.list")}
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/for-apartments" className={linkClass}>
                  {t("nav.forApartments")}
                </Link>
              </li>
              <li>
                <Link to="/post-listing" className={linkClass}>
                  {t("nav.post")}
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className={linkClass}>
                  {t("nav.dashboard")}
                </Link>
              </li>
              <li>
                <Link to="/about" className={linkClass}>
                  {t("nav.about")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="mb-3 font-sans text-sm font-semibold tracking-normal text-white">
              {t("footer.help")}
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href={`https://wa.me/${SUPPORT_WHATSAPP}`}
                  target="_blank"
                  rel="noreferrer"
                  className={linkClass}
                >
                  {t("footer.whatsapp")}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <Link to="/terms" className={linkClass}>
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className={linkClass}>
                  {t("footer.privacy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-8 border-t border-white/15 pt-6 text-sm">
          © {new Date().getFullYear()} HomeLink Rwanda
        </p>
      </div>
    </footer>
  );
}
