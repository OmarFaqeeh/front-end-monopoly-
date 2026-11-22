// next-intl routing: supported locales and default locale (English only for now; add locales here).
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en"],
  defaultLocale: "en",
  localeCookie: { name: "NEXT_LOCALE", maxAge: 60 * 60 * 24 * 365 },
});

export type Locale = (typeof routing.locales)[number];
