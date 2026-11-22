// Dev tool (no runtime dependency): turns art in characters-incoming/ into public/characters/cNN.png + manifest.
// Usage: npm run characters:prepare [-- <incomingDir>] [--grid 4x3] [--model isnet-general-use]
//
// - ONE image  -> a sheet: only the COLSxROWS character grid is used (title text and buttons are ignored).
//   Cells are found by projections of the foreground mask, characters are matted (rembg when available, else
//   a flood-fill fallback), sorted left-to-right then top-to-bottom as c01..cNN.
// - SEVERAL images -> one character per image, sorted by file name.
// Each character: transparent PNG, 4px margin, scaled DOWN to at most 512px tall (never upscaled).
// Matting: set REMBG_PYTHON to a python with `rembg` installed (see scripts/matte.py).
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MAX_CHARACTERS = 12;
const MARGIN = 4;
const MAX_HEIGHT = 512;

async function loadRaw(input, channels = 4) {
  const img = sharp(input);
  const { data, info } = await (channels === 4 ? img.ensureAlpha() : img.removeAlpha()).raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

/* ------------------------------------------------------------------ flood-fill fallback / generic sheets */

/** Make the flat background transparent by flood-filling from the four corners. */
export function removeBackground(raw, tolerance = 28) {
  const { data, w, h } = raw;
  const px = (x, y) => (y * w + x) * 4;
  const out = Buffer.from(data);
  const seen = new Uint8Array(w * h);
  for (const [cx, cy] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]) {
    const i = px(cx, cy);
    if (data[i + 3] < 16) continue;
    const ref = [data[i], data[i + 1], data[i + 2]];
    const local = [[cx, cy]];
    while (local.length) {
      const [x, y] = local.pop();
      if (x < 0 || y < 0 || x >= w || y >= h || seen[y * w + x]) continue;
      const j = px(x, y);
      const d = Math.abs(data[j] - ref[0]) + Math.abs(data[j + 1] - ref[1]) + Math.abs(data[j + 2] - ref[2]);
      if (data[j + 3] >= 16 && d > tolerance * 3) continue;
      seen[y * w + x] = 1;
      out[j + 3] = 0;
      local.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  }
  return { data: out, w, h };
}

/** Connected components of non-transparent pixels (4-connectivity). */
export function components(raw) {
  const { data, w, h } = raw;
  const label = new Int32Array(w * h);
  const comps = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (label[idx] || data[idx * 4 + 3] < 16) continue;
      const id = comps.length + 1;
      let minX = x, maxX = x, minY = y, maxY = y, count = 0;
      const stack = [idx];
      label[idx] = id;
      while (stack.length) {
        const cur = stack.pop();
        const cx = cur % w;
        const cy = (cur / w) | 0;
        count++;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;
        for (const n of [cur + 1, cur - 1, cur + w, cur - w]) {
          if (n < 0 || n >= w * h) continue;
          if ((n === cur + 1 && cx === w - 1) || (n === cur - 1 && cx === 0)) continue;
          if (label[n] || data[n * 4 + 3] < 16) continue;
          label[n] = id;
          stack.push(n);
        }
      }
      comps.push({ id, minX, maxX, minY, maxY, count });
    }
  }
  return { label, comps };
}

/** Left-to-right, top-to-bottom ordering (rows are clustered by vertical center). */
export function sortReadingOrder(comps) {
  const heights = comps.map((c) => c.maxY - c.minY + 1).sort((a, b) => a - b);
  const median = heights[(heights.length / 2) | 0] ?? 1;
  const rows = [];
  for (const c of [...comps].sort((a, b) => a.minY + a.maxY - (b.minY + b.maxY))) {
    const cy = (c.minY + c.maxY) / 2;
    const row = rows.find((r) => Math.abs(r.cy - cy) < median * 0.6);
    if (row) {
      row.items.push(c);
      row.cy = (row.cy * (row.items.length - 1) + cy) / row.items.length;
    } else rows.push({ cy, items: [c] });
  }
  rows.sort((a, b) => a.cy - b.cy);
  return rows.flatMap((r) => r.items.sort((a, b) => a.minX - b.minX));
}

/** Crop the kept components out of an RGBA raw image into trimmed, margined PNG buffers. */
async function exportComponents(raw, label, kept) {
  const out = [];
  for (const c of kept) {
    const cw = c.maxX - c.minX + 1;
    const ch = c.maxY - c.minY + 1;
    const buf = Buffer.alloc(cw * ch * 4);
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const sx = c.minX + x;
        const sy = c.minY + y;
        if (label[sy * raw.w + sx] !== c.id) continue;
        const si = (sy * raw.w + sx) * 4;
        buf.set(raw.data.subarray(si, si + 4), (y * cw + x) * 4);
      }
    }
    out.push(await finish(buf, cw, ch));
  }
  return out;
}

async function finish(buf, w, h) {
  return sharp(buf, { raw: { width: w, height: h, channels: 4 } })
    .extend({ top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ height: MAX_HEIGHT, withoutEnlargement: true, kernel: "lanczos3", fit: "inside" })
    .png()
    .toBuffer();
}

/** Generic sheet (flat background): flood fill + components, sorted in reading order. */
export async function splitSheet(input) {
  const raw = removeBackground(await loadRaw(input));
  const { label, comps } = components(raw);
  const largest = Math.max(...comps.map((c) => c.count), 1);
  const kept = sortReadingOrder(comps.filter((c) => c.count >= largest * 0.02)).slice(0, MAX_CHARACTERS);
  return exportComponents(raw, label, kept);
}

export async function prepareSingle(input) {
  const [first] = await splitSheet(input);
  return first;
}

/* ------------------------------------------------------------------ grid sheets (e.g. 4x3 character grid) */

function runs(counts, minCount, mergeGap) {
  const out = [];
  let start = -1;
  for (let i = 0; i <= counts.length; i++) {
    const on = i < counts.length && counts[i] >= minCount;
    if (on && start < 0) start = i;
    if (!on && start >= 0) {
      const last = out[out.length - 1];
      if (last && start - last.end <= mergeGap) last.end = i - 1;
      else out.push({ start, end: i - 1 });
      start = -1;
    }
  }
  for (const r of out) r.mass = counts.slice(r.start, r.end + 1).reduce((a, b) => a + b, 0);
  return out;
}

/**
 * Find the horizontal bands of the character grid. The foreground (anything that differs from the corner
 * background color) is projected onto rows; the `rows` heaviest runs are the character rows. Title text and
 * buttons are lighter runs and are ignored. Neighbouring characters in a row touch, so rows are matted whole
 * and split afterwards into connected components (see splitBand).
 */
export async function detectRows(input, { rows = 3, threshold = 60, pad = 14 } = {}) {
  const { data, w, h } = await loadRaw(input, 3);
  const bg = [0, 1, 2].map((c) => (data[c] + data[(w - 1) * 3 + c] + data[(h - 1) * w * 3 + c] + data[((h - 1) * w + w - 1) * 3 + c]) / 4);
  const rowCounts = new Array(h).fill(0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      const d = Math.max(Math.abs(data[i] - bg[0]), Math.abs(data[i + 1] - bg[1]), Math.abs(data[i + 2] - bg[2]));
      if (d > threshold) rowCounts[y]++;
    }
  }
  const found = runs(rowCounts, w * 0.01, 10).sort((a, b) => b.mass - a.mass).slice(0, rows).sort((a, b) => a.start - b.start);
  if (found.length < rows) throw new Error(`Found ${found.length} character rows, expected ${rows}`);
  return found.map((r) => ({ y: Math.max(0, r.start - pad), h: Math.min(h, r.end + pad + 1) - Math.max(0, r.start - pad), w }));
}

/** Matte crops with rembg (python). Returns RGBA buffers, or null when rembg is unavailable. */
async function matteWithRembg(crops, model) {
  const python = process.env.REMBG_PYTHON;
  if (!python) return null;
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "matte-"));
  const inDir = path.join(dir, "in");
  const outDir = path.join(dir, "out");
  await fs.mkdir(inDir);
  for (let i = 0; i < crops.length; i++) await fs.writeFile(path.join(inDir, `${String(i).padStart(2, "0")}.png`), crops[i]);
  const r = spawnSync(python, [path.join(ROOT, "scripts", "matte.py"), inDir, outDir, model], { encoding: "utf8" });
  if (r.status !== 0) {
    console.error(r.stderr);
    return null;
  }
  const outs = [];
  for (let i = 0; i < crops.length; i++) outs.push(await fs.readFile(path.join(outDir, `${String(i).padStart(2, "0")}.png`)));
  await fs.rm(dir, { recursive: true, force: true });
  return outs;
}

/** Harden the soft matte edge so the background glow does not survive as a halo. */
function harden(raw, low, high) {
  const { data, w, h } = raw;
  for (let i = 0; i < w * h; i++) {
    const a = data[i * 4 + 3];
    data[i * 4 + 3] = a <= low ? 0 : a >= high ? 255 : Math.round(((a - low) / (high - low)) * 255);
  }
}

/** Semi-transparent edge pixels take the color of nearby solid pixels (removes dark-purple fringes). */
function bleedEdges(raw) {
  const { data, w, h } = raw;
  const out = Buffer.from(data);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = data[i + 3];
      if (a === 0 || a === 255) continue;
      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          const j = (yy * w + xx) * 4;
          if (data[j + 3] === 255) {
            r += data[j]; g += data[j + 1]; b += data[j + 2]; n++;
          }
        }
      }
      if (n) {
        out[i] = r / n; out[i + 1] = g / n; out[i + 2] = b / n;
      }
    }
  }
  return { data: out, w, h };
}

/** Shrink the opaque area by r pixels (removes the glow ring that the matte keeps around the art). */
function erodeAlpha(raw, r) {
  const { data, w, h } = raw;
  const out = Buffer.from(data);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (data[i + 3] === 0) continue;
      let clear = false;
      for (let dy = -r; dy <= r && !clear; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h || data[(yy * w + xx) * 4 + 3] === 0) {
            clear = true;
            break;
          }
        }
      }
      if (clear) out[i + 3] = 0;
    }
  }
  return { data: out, w, h };
}

/**
 * Split a matted band into `cols` characters (connected components, left to right). Small satellite parts
 * (a cigarette, a ribbon end) join the nearest character.
 */
export async function splitBand(mattedPng, cols, { low = 70, high = 215, trim = 3 } = {}) {
  const raw = await loadRaw(mattedPng);
  harden(raw, low, high);
  const { label, comps } = components(raw);
  const bySize = [...comps].sort((a, b) => b.count - a.count);
  const mains = bySize.slice(0, cols);
  if (mains.length < cols) throw new Error(`Found ${mains.length} characters in a band, expected ${cols}`);
  const groups = mains.map((m) => ({ ids: new Set([m.id]), minX: m.minX, maxX: m.maxX, minY: m.minY, maxY: m.maxY }));
  for (const c of bySize.slice(cols)) {
    if (c.count < mains[mains.length - 1].count * 0.005) continue; // dust
    const cx = (c.minX + c.maxX) / 2;
    const cy = (c.minY + c.maxY) / 2;
    let best = null;
    let bestD = 40;
    groups.forEach((g, i) => {
      const d = Math.hypot(Math.max(g.minX - cx, 0, cx - g.maxX), Math.max(g.minY - cy, 0, cy - g.maxY));
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best != null) {
      const g = groups[best];
      g.ids.add(c.id);
      g.minX = Math.min(g.minX, c.minX);
      g.maxX = Math.max(g.maxX, c.maxX);
      g.minY = Math.min(g.minY, c.minY);
      g.maxY = Math.max(g.maxY, c.maxY);
    }
  }
  const out = [];
  for (const g of groups.sort((a, b) => a.minX - b.minX)) {
    const cw = g.maxX - g.minX + 1;
    const ch = g.maxY - g.minY + 1;
    const buf = Buffer.alloc(cw * ch * 4);
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const sx = g.minX + x, sy = g.minY + y;
        if (!g.ids.has(label[sy * raw.w + sx])) continue;
        const si = (sy * raw.w + sx) * 4;
        buf.set(raw.data.subarray(si, si + 4), (y * cw + x) * 4);
      }
    }
    const eroded = trim > 0 ? erodeAlpha({ data: buf, w: cw, h: ch }, trim) : { data: buf, w: cw, h: ch };
    const cleaned = bleedEdges(eroded);
    out.push(await finish(cleaned.data, cw, ch));
  }
  return out;
}

/** Extract the characters of a COLSxROWS sheet. Uses rembg matting when REMBG_PYTHON is set, else flood fill. */
export async function extractGrid(input, { cols = 4, rows = 3, model = "isnet-general-use" } = {}) {
  const bands = await detectRows(input, { rows });
  const crops = await Promise.all(bands.map((b) => sharp(input).extract({ left: 0, top: b.y, width: b.w, height: b.h }).png().toBuffer()));
  const matted = await matteWithRembg(crops, model);
  let mattes = matted;
  if (matted) console.log(`Matting: rembg (${model})`);
  else {
    console.log("Matting: flood-fill fallback (set REMBG_PYTHON for proper matting)");
    mattes = [];
    for (const c of crops) {
      const raw = removeBackground(await loadRaw(c));
      mattes.push(await sharp(raw.data, { raw: { width: raw.w, height: raw.h, channels: 4 } }).png().toBuffer());
    }
  }
  const out = [];
  for (const m of mattes) out.push(...(await splitBand(m, cols)));
  return out;
}

/* ------------------------------------------------------------------ colors, manifest, contact sheet */

/** Dominant body color: most frequent quantized color among reasonably saturated opaque pixels. */
export async function dominantColor(png) {
  const { data, w, h } = await loadRaw(png);
  const hist = new Map();
  for (let i = 0; i < w * h; i++) {
    if (data[i * 4 + 3] < 200) continue;
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max < 40 || (max - min) / (max || 1) < 0.18) continue;
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    hist.set(key, (hist.get(key) ?? 0) + 1);
  }
  const best = [...hist.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0x888;
  const to = (v) => (((v & 15) << 4) | 8).toString(16).padStart(2, "0");
  return `#${to(best >> 8)}${to(best >> 4)}${to(best)}`;
}

async function contactSheet(pngs, file, bg) {
  const cell = 200;
  const perRow = 4;
  const tiles = await Promise.all(
    pngs.map(async (p, i) => ({
      input: await sharp(p).resize(cell - 16, cell - 16, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
      left: (i % perRow) * cell + 8,
      top: Math.floor(i / perRow) * cell + 8,
    })),
  );
  await sharp({ create: { width: cell * perRow, height: cell * Math.ceil(pngs.length / perRow), channels: 3, background: bg } })
    .composite(tiles)
    .png()
    .toFile(file);
}

async function main() {
  const args = process.argv.slice(2);
  const flag = (name, def) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : def;
  };
  const positional = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
  const incoming = path.resolve(positional[0] ?? path.join(ROOT, "characters-incoming"));
  const [cols, rows] = flag("grid", "4x3").split("x").map(Number);
  const model = flag("model", "isnet-general-use");
  const outDir = path.join(ROOT, "public", "characters");
  const manifestPath = path.join(outDir, "characters.json");
  await fs.mkdir(outDir, { recursive: true });

  const files = (await fs.readdir(incoming).catch(() => []))
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f) && !f.startsWith("contact-"))
    .sort();
  if (!files.length) {
    console.log(`No images in ${incoming}. Nothing to do (temporary SVG characters stay in use).`);
    return;
  }

  let pngs;
  if (files.length === 1) {
    const sheet = path.join(incoming, files[0]);
    const m = await sharp(sheet).metadata();
    console.log(`Sheet ${files[0]}: ${m.width}x${m.height}, grid ${cols}x${rows}`);
    pngs = await extractGrid(sheet, { cols, rows, model });
  } else {
    pngs = [];
    for (const f of files) pngs.push(await prepareSingle(path.join(incoming, f)));
  }

  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const count = Math.min(pngs.length, MAX_CHARACTERS);
  for (let i = 0; i < count; i++) {
    const id = `c${String(i + 1).padStart(2, "0")}`;
    const file = `${id}.png`;
    await fs.writeFile(path.join(outDir, file), pngs[i]);
    let entry = manifest.find((m) => m.id === id);
    if (!entry) {
      entry = { id, nameKey: `room.characters.${id}` };
      manifest.push(entry);
    }
    Object.assign(entry, { file, dominantColor: await dominantColor(pngs[i]), source: "art" });
    const meta = await sharp(pngs[i]).metadata();
    console.log(`${id}: ${meta.width}x${meta.height}  ${entry.dominantColor}`);
  }
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  await contactSheet(pngs.slice(0, count), path.join(incoming, "contact-light.png"), "#eef2e6");
  await contactSheet(pngs.slice(0, count), path.join(incoming, "contact-dark.png"), "#141c17");
  const temp = manifest.filter((m) => m.source === "temp").map((m) => m.id);
  console.log(`\nN = ${count} characters from art.${temp.length ? ` Still temporary: ${temp.join(", ")}.` : ""}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
}
