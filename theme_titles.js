import { getLang } from './localization.js';

const THEME_TITLES = {
  ru: {
    food: 'Еда',
    cat: 'Котики',
    new_year: 'Новый год',
    dog: 'Собаки',
    flowers: 'Цветы',
    fishing: 'Рыбалка',
    animals: 'Животные',
    city: 'Город',
    fruits: 'Фрукты',
    home: 'Дом',
    earth: 'Земля',
    motorcycles: 'Мотоциклы',
    retro_cars: 'Ретро машины',
    nature: 'Природа',
    cars: 'Машины',
    cakes: 'Торты',
    gori: 'Горы',
    korabl: 'Корабли',
    cofe: 'Кофе',
    winter: 'Зима',
  },
  en: {
    food: 'Food',
    cat: 'Cats',
    new_year: 'New Year',
    dog: 'Dogs',
    flowers: 'Flowers',
    fishing: 'Fishing',
    animals: 'Animals',
    city: 'City',
    fruits: 'Fruits',
    home: 'Home',
    earth: 'Earth',
    motorcycles: 'Motorcycles',
    retro_cars: 'Retro Cars',
    nature: 'Nature',
    cars: 'Cars',
    cakes: 'Cakes',
    gori: 'Mountains',
    korabl: 'Ships',
    cofe: 'Coffee',
    winter: 'Winter',
  },
};

export function getThemeTitle(themeId) {
  const lang = getLang();
  return THEME_TITLES[lang]?.[themeId] || THEME_TITLES.ru[themeId] || themeId;
}


