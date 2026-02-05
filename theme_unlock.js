import { saveToCloud, loadFromCloud } from './cloud_storage.js';

const UNLOCKED_THEMES_KEY = 'jigmerge_unlocked_themes';
const AD_PROGRESS_KEY = 'jigmerge_ad_progress';
const COINS_THEMES = ['flowers', 'city', 'nature', 'cofe'];
const AD_THEMES = ['animals', 'cakes', 'motorcycles', 'home'];
const DOUBLE_AD_THEMES = ['gori', 'winter'];

const BASE_PRICE = 1000;
const PRICE_INCREMENT = 500;

async function getUnlockedThemes() {
  const stored = await loadFromCloud(UNLOCKED_THEMES_KEY, []);
  return Array.isArray(stored) ? stored : [];
}

async function setUnlockedThemes(themes) {
  await saveToCloud(UNLOCKED_THEMES_KEY, themes);
}

async function getAdProgress() {
  const stored = await loadFromCloud(AD_PROGRESS_KEY, {});
  return typeof stored === 'object' && stored !== null ? stored : {};
}

async function setAdProgress(progress) {
  await saveToCloud(AD_PROGRESS_KEY, progress);
}

export async function getThemeAdProgress(themeId) {
  if (!isDoubleAdTheme(themeId)) {
    return 0;
  }
  const progress = await getAdProgress();
  return typeof progress[themeId] === 'number' ? progress[themeId] : 0;
}

export async function incrementThemeAdProgress(themeId) {
  if (!isDoubleAdTheme(themeId)) {
    return false;
  }
  const progress = await getAdProgress();
  const current = typeof progress[themeId] === 'number' ? progress[themeId] : 0;
  progress[themeId] = current + 1;
  await setAdProgress(progress);
  
  if (progress[themeId] >= 2) {
    await unlockTheme(themeId);
    return true;
  }
  return false;
}

export async function isThemeUnlocked(themeId) {
  if (!isCoinsTheme(themeId) && !isAdTheme(themeId) && !isDoubleAdTheme(themeId)) {
    return true;
  }
  const unlocked = await getUnlockedThemes();
  return unlocked.includes(themeId);
}

export async function unlockTheme(themeId) {
  const unlocked = await getUnlockedThemes();
  if (!unlocked.includes(themeId)) {
    unlocked.push(themeId);
    await setUnlockedThemes(unlocked);
  }
}

export async function getThemePrice(themeId) {
  if (!COINS_THEMES.includes(themeId)) {
    return null;
  }
  
  const unlocked = await getUnlockedThemes();
  const coinsThemesUnlocked = unlocked.filter(id => COINS_THEMES.includes(id));
  const priceIndex = coinsThemesUnlocked.length;
  
  return BASE_PRICE + (priceIndex * PRICE_INCREMENT);
}

export function isCoinsTheme(themeId) {
  return COINS_THEMES.includes(themeId);
}

export function isAdTheme(themeId) {
  return AD_THEMES.includes(themeId);
}

export function isDoubleAdTheme(themeId) {
  return DOUBLE_AD_THEMES.includes(themeId);
}

export async function getUnlockedCoinsThemesCount() {
  const unlocked = await getUnlockedThemes();
  return unlocked.filter(id => COINS_THEMES.includes(id)).length;
}

