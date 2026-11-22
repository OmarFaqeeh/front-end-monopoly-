// Runs the monorepo's shared-folder sync when it exists (local monorepo checkout); does nothing in a standalone
// front-end checkout, where src/shared is already committed.
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const script = path.resolve(import.meta.dirname, "..", "..", "scripts", "sync-shared.mjs");
if (existsSync(script)) await import(pathToFileURL(script).href);
