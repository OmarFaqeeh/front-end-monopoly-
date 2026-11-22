export function splitSheet(input: string | Buffer): Promise<Buffer[]>;
export function prepareSingle(input: string | Buffer): Promise<Buffer>;
export function dominantColor(png: Buffer): Promise<string>;
export function detectRows(
  input: string | Buffer,
  opts?: { rows?: number; threshold?: number; pad?: number },
): Promise<{ y: number; h: number; w: number }[]>;
export function splitBand(png: Buffer, cols: number, opts?: { low?: number; high?: number }): Promise<Buffer[]>;
export function extractGrid(input: string | Buffer, opts?: { cols?: number; rows?: number; model?: string }): Promise<Buffer[]>;
