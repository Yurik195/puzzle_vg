// VK Integration для облачных сохранений и социальных функций
import { getBridge } from './playgama_sdk.js';

let vkBridge = null;
let isVKPlatform = false;
let isInitialized = false;

// Инициализация VK Bridge
export async function initVKBridge() {
  if (isInitialized) {
    return isVKPlatform;
  }
  
  try {
    const bridge = getBridge();
    
    // Проверяем, что мы на платформе VK
    if (bridge && bridge.platform && bridge.platform.id === 'vk') {
      isVKPlatform = true;
      
      // Проверяем наличие VK Bridge
      if (typeof window.vkBridge !== 'undefined') {
        vkBridge = window.vkBridge;
        await vkBridge.send('VKWebAppInit');
        console.log('✅ VK Bridge инициализирован');
        isInitialized = true;
        return true;
      } else {
        console.warn('⚠️ VK Bridge SDK не найден');
        isVKPlatform = false;
      }
    } else {
      console.log('ℹ️ Не VK платформа, VK функции отключены');
    }
  } catch (e) {
    console.error('❌ Ошибка инициализации VK Bridge:', e);
    isVKPlatform = false;
  }
  
  isInitialized = true;
  return isVKPlatform;
}

// Проверка, доступен ли VK Bridge
export function isVKAvailable() {
  return isVKPlatform && vkBridge !== null;
}

// Сохранение данных в VK облако
export async function saveToVKCloud(key, value) {
  if (!isVKAvailable()) {
    console.warn('💾 VK Bridge недоступен для сохранения');
    return false;
  }
  
  try {
    await vkBridge.send('VKWebAppStorageSet', {
      key: key,
      value: String(value)
    });
    console.log(`💾 Сохранено в VK облако: ${key}`);
    return true;
  } catch (e) {
    console.error(`❌ Ошибка сохранения ${key} в VK облако:`, e);
    return false;
  }
}

// Загрузка данных из VK облака
export async function loadFromVKCloud(keys) {
  if (!isVKAvailable()) {
    console.warn('📥 VK Bridge недоступен для загрузки');
    return null;
  }
  
  try {
    const result = await vkBridge.send('VKWebAppStorageGet', {
      keys: Array.isArray(keys) ? keys : [keys]
    });
    console.log(`📥 Загружено из VK облака:`, result.keys);
    return result.keys;
  } catch (e) {
    console.error('❌ Ошибка загрузки из VK облака:', e);
    return null;
  }
}

// Поделиться игрой
export async function shareGame() {
  if (!isVKAvailable()) {
    console.warn('⚠️ VK Bridge недоступен для шаринга');
    return false;
  }
  
  try {
    await vkBridge.send('VKWebAppShare', {
      link: 'https://vk.com/app51868962'
    });
    console.log('✅ Поделились игрой');
    return true;
  } catch (e) {
    console.error('❌ Ошибка при попытке поделиться:', e);
    return false;
  }
}

// Открыть сообщество VK
export function openVKCommunity() {
  if (!isVKAvailable()) {
    console.warn('⚠️ VK Bridge недоступен');
    // Fallback - открываем в новом окне
    window.open('https://vk.com/club217329390', '_blank');
    return;
  }
  
  try {
    // Открываем сообщество в новом окне
    window.open('https://vk.com/club217329390', '_blank');
    console.log('✅ Открыто сообщество VK');
  } catch (e) {
    console.error('❌ Ошибка открытия сообщества:', e);
  }
}
