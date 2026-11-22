// Room page: loading screen, color picker and lobby for a room code (local mock, no sockets yet).
import { setRequestLocale } from "next-intl/server";
import RoomShell from "@/components/room/RoomShell";

export default async function RoomPage({ params }: PageProps<"/[locale]/room/[code]">) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  return <RoomShell code={code.toUpperCase()} />;
}
