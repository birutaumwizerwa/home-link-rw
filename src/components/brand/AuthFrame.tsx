import { useTranslation } from "react-i18next";
import { ImigongoPanel } from "@/components/brand/Imigongo";
import { Logo } from "@/components/brand/Logo";

/** Split layout shared by sign in, sign up and password pages. */
export function AuthFrame({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_520px]">
      <div className="flex flex-col">
        <header className="flex h-16 items-center px-4 sm:px-8">
          <Logo />
        </header>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-12 pt-4">
          {children}
        </main>
      </div>
      <aside className="relative hidden overflow-hidden bg-ink lg:block" aria-hidden="true">
        <ImigongoPanel className="absolute inset-0 h-full w-full opacity-90" />
        <div className="absolute inset-x-8 bottom-8 rounded-lg bg-ink p-6 text-white">
          <p className="font-display text-2xl font-bold leading-tight">{t("auth.panelTitle")}</p>
          <p className="mt-2 text-white/75">{t("auth.panelBody")}</p>
        </div>
      </aside>
    </div>
  );
}
