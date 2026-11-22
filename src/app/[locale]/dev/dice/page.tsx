// Dev-only page to verify the 3D dice (returns 404 in production).
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import DevDice from "@/components/board/DevDice";

export default async function DevDicePage({ params }: PageProps<"/[locale]/dev/dice">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { locale } = await params;
  setRequestLocale(locale);
  return <DevDice />;
}
