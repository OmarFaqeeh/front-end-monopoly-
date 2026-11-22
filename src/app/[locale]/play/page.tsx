// Join by Room ID: six digit boxes (nickname already entered on the landing page).
import { setRequestLocale } from "next-intl/server";
import PlayScreen from "@/components/play/PlayScreen";

export default async function PlayPage({ params }: PageProps<"/[locale]/play">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PlayScreen />;
}
