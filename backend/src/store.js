import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

const DEFAULT_STORE = {
  models: [],
  prompt: "",
  lastRun: null
};

async function ensureStoreFile() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await access(STORE_FILE);
  } catch {
    await writeFile(STORE_FILE, JSON.stringify(DEFAULT_STORE, null, 2), "utf-8");
  }
}

export async function loadStore() {
  await ensureStoreFile();
  const raw = await readFile(STORE_FILE, "utf-8");
  const parsed = JSON.parse(raw);

  return {
    ...DEFAULT_STORE,
    ...parsed,
    models: Array.isArray(parsed.models) ? parsed.models : DEFAULT_STORE.models
  };
}

export async function saveStore(nextStore) {
  await ensureStoreFile();
  const normalized = {
    ...DEFAULT_STORE,
    ...nextStore,
    models: Array.isArray(nextStore.models) ? nextStore.models : DEFAULT_STORE.models
  };

  await writeFile(STORE_FILE, JSON.stringify(normalized, null, 2), "utf-8");

  return normalized;
}

export async function updateStore(updater) {
  const current = await loadStore();
  const updated = await updater(current);
  return saveStore(updated);
}
