// Site footer: small wordmark, placeholder links, language switcher, copyright, disclaimer.
import { getTranslations } from "next-intl/server";

export default async function SiteFooter() {
  const t = await getTranslations("landing");
  const links = ["rules", "privacy", "terms"] as const;

  return (
    <footer className="bg-surface-sunken px-4 py-14 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 text-center sm:flex-row sm:justify-between sm:text-start">
        <p className="font-heading text-xl font-semibold uppercase tracking-[0.14em] text-ink">
          {t("wordmark.latin")}
        </p>
        <nav aria-label={t("footer.nav")}>
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            {links.map((k) => (
              <li key={k}>
                <a href="#" className="text-sm text-ink-muted hover:text-ink">
                  {t(`footer.${k}`)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="mx-auto mt-10 max-w-6xl border-t border-line pt-6 text-center text-xs leading-relaxed text-ink-muted">
        <p>{t("footer.copyright")}</p>
        <p className="mt-1">{t("footer.disclaimer")}</p>
      </div>
    </footer>
  );
}
