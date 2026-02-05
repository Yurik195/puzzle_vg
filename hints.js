import { saveToCloud, loadFromCloud } from './cloud_storage.js';
import { isFirstRun } from './progress.js';

const HINTS_STORAGE_KEY = 'jigmerge_hints_count';
const INITIAL_HINTS = 5;

let hintsCache = null;
let hintsInitialized = false;

async function initHints() {
  if (hintsInitialized) {
    return hintsCache;
  }
  
  const stored = await loadFromCloud(HINTS_STORAGE_KEY, null);
  if (stored === null) {
    const firstRun = await isFirstRun();
    if (firstRun) {
      hintsCache = INITIAL_HINTS;
      await setHintsCount(INITIAL_HINTS);
    } else {
      hintsCache = 0;
      await setHintsCount(0);
    }
  } else {
    hintsCache = typeof stored === 'number' ? stored : 0;
  }
  
  hintsInitialized = true;
  return hintsCache;
}

export async function getHintsCount() {
  if (!hintsInitialized) {
    await initHints();
  }
  return hintsCache || 0;
}

export async function setHintsCount(count) {
  hintsCache = count;
  await saveToCloud(HINTS_STORAGE_KEY, count);
}

export function getHintsCountSync() {
  return hintsCache || 0;
}

export async function useHint() {
  const current = await getHintsCount();
  if (current > 0) {
    await setHintsCount(current - 1);
    return true;
  }
  return false;
}

export async function addHints(count) {
  const current = await getHintsCount();
  await setHintsCount(current + count);
}

