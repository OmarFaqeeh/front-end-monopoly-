"use client";
// Share panel: the invite link and the Room ID (six read-only digit boxes), each with a Copy button.
import { Check, Copy } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const noopSubscribe = () => () => {};

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return; // clipboard unavailable: do not claim success
    }
    setCopied(id);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1600);
  }
  return { copied, copy };
}

export default function SharePanel({ code }: { code: string }) {
  const t = useTranslations("room.share");
  const locale = useLocale();
  const origin = useSyncExternalStore(noopSubscribe, () => window.location.origin, () => "");
  const url = `${origin}/${locale}/room/${code}`;
  const { copied, copy } = useCopy();

  const copyButton = (id: string, text: string, label: string) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => copy(id, text)}
      icon={copied === id ? <Check size={16} strokeWidth={1.5} /> : <Copy size={16} strokeWidth={1.5} />}
      aria-live="polite"
    >
      {copied === id ? t("copied") : label}
    </Button>
  );

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h3 className="mb-2 font-semibold text-ink">{t("title")}</h3>
        <p className="mb-2 text-xs tracking-wide text-ink-muted uppercase">{t("linkTitle")}</p>
        <div className="flex gap-2">
          <input
            readOnly
            value={url}
            aria-label={t("urlLabel")}
            dir="ltr"
            onFocus={(e) => e.currentTarget.select()}
            className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-surface-sunken px-3 text-sm text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
          {copyButton("link", url, t("copy"))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs tracking-wide text-ink-muted uppercase">{t("idTitle")}</p>
        <div className="flex flex-col gap-2">
          <div dir="ltr" className="grid min-w-0 grid-cols-6 gap-1.5">
            {code.split("").map((d, i) => (
              <input
                key={i}
                readOnly
                value={d}
                aria-label={t("digit", { n: i + 1 })}
                tabIndex={-1}
                className="h-10 w-full min-w-0 rounded-lg border border-line bg-surface-sunken px-0 text-center font-mono text-lg font-semibold text-ink"
              />
            ))}
          </div>
          <div>{copyButton("id", code, t("copyId"))}</div>
        </div>
      </div>
    </Card>
  );
}
