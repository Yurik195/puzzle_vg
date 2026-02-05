import { getThemeTitle } from './theme_titles.js';

export const THEMES = [
  {
    id: 'food',
    get title() { return getThemeTitle('food'); },
    emoji: '🍕',
    folder: 'food',
  },
  {
    id: 'cat',
    get title() { return getThemeTitle('cat'); },
    emoji: '🐱',
    folder: 'cat',
  },
  {
    id: 'new_year',
    get title() { return getThemeTitle('new_year'); },
    emoji: '🎄',
    folder: 'new year',
  },
  {
    id: 'dog',
    get title() { return getThemeTitle('dog'); },
    emoji: '🐶',
    folder: 'dog',
  },
  {
    id: 'flowers',
    get title() { return getThemeTitle('flowers'); },
    emoji: '🌸',
    folder: 'flowers',
  },
  {
    id: 'fishing',
    get title() { return getThemeTitle('fishing'); },
    emoji: '🎣',
    folder: 'fishing',
  },
  {
    id: 'animals',
    get title() { return getThemeTitle('animals'); },
    emoji: '🐾',
    folder: 'animals',
  },
  {
    id: 'city',
    get title() { return getThemeTitle('city'); },
    emoji: '🏢',
    folder: 'city',
  },
  {
    id: 'fruits',
    get title() { return getThemeTitle('fruits'); },
    emoji: '🍎',
    folder: 'fruits',
  },
  {
    id: 'home',
    get title() { return getThemeTitle('home'); },
    emoji: '🏡',
    folder: 'home',
  },
  {
    id: 'earth',
    get title() { return getThemeTitle('earth'); },
    emoji: '🌍',
    folder: 'Earth',
  },
  {
    id: 'motorcycles',
    get title() { return getThemeTitle('motorcycles'); },
    emoji: '🏍️',
    folder: 'motorcycles',
  },
  {
    id: 'retro_cars',
    get title() { return getThemeTitle('retro_cars'); },
    emoji: '🚗',
    folder: 'retro cars',
  },
  {
    id: 'nature',
    get title() { return getThemeTitle('nature'); },
    emoji: '🌿',
    folder: 'nature',
  },
  {
    id: 'cars',
    get title() { return getThemeTitle('cars'); },
    emoji: '🚘',
    folder: 'cars',
  },
  {
    id: 'cakes',
    get title() { return getThemeTitle('cakes'); },
    emoji: '🍰',
    folder: 'cakes',
  },
  {
    id: 'gori',
    get title() { return getThemeTitle('gori'); },
    emoji: '⛰️',
    folder: 'gori',
  },
  {
    id: 'korabl',
    get title() { return getThemeTitle('korabl'); },
    emoji: '⚓',
    folder: 'korabl',
  },
  {
    id: 'cofe',
    get title() { return getThemeTitle('cofe'); },
    emoji: '☕',
    folder: 'cofe',
  },
  {
    id: 'winter',
    get title() { return getThemeTitle('winter'); },
    emoji: '❄️',
    folder: 'winter',
  },
];

export function getThemeById(themeId) {
  return THEMES.find(theme => theme.id === themeId) || null;
}

export function getThemeByFolder(folder) {
  return THEMES.find(theme => theme.folder === folder) || null;
}

