import { saveToCloud, loadFromCloud } from './cloud_storage.js';

const PROGRESS_PREFIX = 'jigmerge_progress_';
const TOTAL_PREFIX = 'jigmerge_total_';
const FIRST_RUN_KEY = 'jigmerge_first_run';
const LAST_VISIT_KEY = 'jigmerge_last_visit';

export function getProgressKey(theme) {
  return `${PROGRESS_PREFIX}${theme}`;
}

export function getTotalKey(theme) {
  return `${TOTAL_PREFIX}${theme}`;
}

export async function getCompletedLevels(theme) {
  const key = getProgressKey(theme);
  const completed = await loadFromCloud(key, 0);
  return Math.max(0, typeof completed === 'number' ? completed : 0);
}

export async function setCompletedLevels(theme, count) {
  const key = getProgressKey(theme);
  await saveToCloud(key, count);
}

export async function getLastKnownTotal(theme) {
  const key = getTotalKey(theme);
  const total = await loadFromCloud(key, 0);
  return Math.max(0, typeof total === 'number' ? total : 0);
}

export async function setLastKnownTotal(theme, total) {
  const key = getTotalKey(theme);
  await saveToCloud(key, total);
}

export async function isFirstRun() {
  const firstRun = await loadFromCloud(FIRST_RUN_KEY, null);
  return firstRun === null;
}

export async function markFirstRunComplete() {
  await saveToCloud(FIRST_RUN_KEY, false);
}

export async function getLastVisitTime() {
  const time = await loadFromCloud(LAST_VISIT_KEY, null);
  return typeof time === 'number' ? time : null;
}

export async function updateLastVisitTime() {
  const now = Date.now();
  await saveToCloud(LAST_VISIT_KEY, now);
}

export async function initializeProgress(theme, currentTotal) {
  const completed = await getCompletedLevels(theme);
  const lastKnownTotal = await getLastKnownTotal(theme);
  const isFirst = await isFirstRun();
  
  if (lastKnownTotal === 0) {
    await setLastKnownTotal(theme, currentTotal);
  }
  
  let hasNewLevels = false;
  if (!isFirst) {
    const lastVisit = await getLastVisitTime();
    if (lastVisit !== null) {
      hasNewLevels = currentTotal > lastKnownTotal;
    }
  }
  
  return {
    completed,
    lastKnownTotal: lastKnownTotal === 0 ? currentTotal : lastKnownTotal,
    currentTotal,
    hasNewLevels
  };
}

export async function updateProgressOnLevelComplete(theme, levelIndex, totalLevels) {
  const currentCompleted = await getCompletedLevels(theme);
  const newCompleted = Math.max(currentCompleted, levelIndex + 1);
  await setCompletedLevels(theme, newCompleted);
  
  if (newCompleted >= totalLevels) {
    await setLastKnownTotal(theme, totalLevels);
  }
}

export async function markThemeAsVisited(theme, currentTotal) {
  const lastKnownTotal = await getLastKnownTotal(theme);
  if (currentTotal > lastKnownTotal) {
    await setLastKnownTotal(theme, currentTotal);
  }
}

export async function hasCompletedAnyLevel() {
  const allData = await loadFromCloud('all_progress', {});
  if (typeof allData === 'object' && allData !== null) {
    for (const key in allData) {
      if (key.startsWith(PROGRESS_PREFIX)) {
        const completed = allData[key];
        if (typeof completed === 'number' && completed > 0) {
          return true;
        }
      }
    }
  }
  return false;
}

const TUTORIAL_COMPLETED_KEY = 'jigmerge_tutorial_completed';

export async function isTutorialCompleted() {
  const completed = await loadFromCloud(TUTORIAL_COMPLETED_KEY, false);
  return completed === true;
}

export async function markTutorialCompleted() {
  await saveToCloud(TUTORIAL_COMPLETED_KEY, true);
}


