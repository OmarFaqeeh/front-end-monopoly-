// Pure layout rule for several tokens in one zone (any tile: Start, Detention "just passing", properties).
export interface TokenLayout {
  /** Character height as a percentage of the token zone height. */
  sizePct: number;
  /** Number of rows the tokens wrap into. */
  rows: number;
  /** Overlap between neighbours as a percentage of the token width. */
  overlapPct: number;
}

const TABLE: { upTo: number; layout: TokenLayout }[] = [
  { upTo: 1, layout: { sizePct: 100, rows: 1, overlapPct: 0 } },
  { upTo: 2, layout: { sizePct: 78, rows: 1, overlapPct: 6 } },
  { upTo: 3, layout: { sizePct: 64, rows: 1, overlapPct: 14 } },
  { upTo: 4, layout: { sizePct: 56, rows: 1, overlapPct: 18 } },
  { upTo: 6, layout: { sizePct: 46, rows: 2, overlapPct: 12 } },
  { upTo: 8, layout: { sizePct: 40, rows: 2, overlapPct: 16 } },
];

/** Layout for `count` tokens. Counts above 8 reuse the 7 to 8 row; 0 or less reuses the single-token row. */
export function tokenLayout(count: number): TokenLayout {
  const row = TABLE.find((r) => count <= r.upTo) ?? TABLE[TABLE.length - 1]!;
  return { ...row.layout };
}

/** Split items into `rows` lines (first lines get the extra items). */
export function splitRows<T>(items: readonly T[], rows: number): T[][] {
  const perRow = Math.max(1, Math.ceil(items.length / rows));
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += perRow) out.push(items.slice(i, i + perRow));
  return out;
}
