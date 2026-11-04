import { Link, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";

export function CompareBar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const compare = useAppStore((s) => s.compare);
  const clear = useAppStore((s) => s.clearCompare);
  const hidden = ["/compare", "/messages", "/post-listing", "/profile"].includes(pathname);
  if (compare.length === 0 || hidden) return null;
  return (
    <div className="fixed bottom-16 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-lg bg-ink px-4 py-3 text-sm text-white shadow-card-hover md:bottom-6">
      <span>{t("compare.selected", { count: compare.length })}</span>
      <span className="flex items-center gap-2">
        <button type="button" onClick={clear} className="underline underline-offset-2">
          {t("compare.clear")}
        </button>
        <Button asChild size="sm" className="bg-marigold text-ink hover:bg-marigold/90">
          <Link to="/compare">{t("compare.open")}</Link>
        </Button>
      </span>
    </div>
  );
}
