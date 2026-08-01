// utils/getDictionary.js
const getWordsFromGoogleDocs = require('./getWordsFromGoogleDocs')
const {
  getSelectedDictionaries,
  fetchSelectedDictionaries,
  getWordOrder
} = require('./userDictionaries')
const { DASH_REGEX } = require('./dashes')
const logger = require('./logger')

// Превращает сырой текст словаря в массив валидных строк "слово - перевод"
function parseDictionaryText(text) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('🇮🇱') && !line.startsWith('___'))
    .filter(line => DASH_REGEX.test(line))
}

// Детерминированный ГПСЧ (mulberry32) - одинаковый seed даёт одинаковый порядок,
// чтобы прогресс-индекс указывал на одно и то же слово между показами.
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Строковый хеш -> 32-битное число (для seed перемешивания)
function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Раскладывает части словаря в один список согласно выбранному режиму.
// parts: [{ name, lines }]  ->  массив строк.
function arrangeWords(parts, mode) {
  // Последовательно: просто склеиваем по порядку
  if (mode !== 'interleave' && mode !== 'shuffle') {
    return parts.reduce((acc, part) => acc.concat(part.lines), [])
  }

  if (mode === 'interleave') {
    // По очереди берём по одному слову из каждой части, пока не исчерпаем все
    const result = []
    const maxLen = Math.max(...parts.map(p => p.lines.length))
    for (let i = 0; i < maxLen; i++) {
      for (const part of parts) {
        if (i < part.lines.length) {
          result.push(part.lines[i])
        }
      }
    }
    return result
  }

  // shuffle: детерминированная перетасовка объединённого списка.
  // Seed зависит от состава набора (имена + размеры частей), поэтому
  // порядок стабилен, пока набор словарей не изменился.
  const merged = parts.reduce((acc, part) => acc.concat(part.lines), [])
  const seedSource = parts.map(p => `${p.name}:${p.lines.length}`).join('|')
  const rand = mulberry32(hashString(seedSource))
  // Перетасовка Фишера — Йетса
  for (let i = merged.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[merged[i], merged[j]] = [merged[j], merged[i]]
  }
  return merged
}

// Функция для получения словаря (одного или нескольких выбранных + по умолчанию)
async function getDictionary(chatId = null) {
  // Части итогового набора: { name, lines }
  const parts = []
  let includeDefault = true
  let hasCustom = false

  if (chatId) {
    const selection = getSelectedDictionaries(chatId)
    includeDefault = selection.includeDefault

    // Загружаем все выбранные личные словари
    try {
      const loaded = await fetchSelectedDictionaries(chatId)
      loaded.forEach(({ title, text }) => {
        const lines = parseDictionaryText(text)
        if (lines.length > 0) {
          parts.push({ name: title, lines })
          hasCustom = true
        }
      })
      if (loaded.length > 0) {
        console.log(`Загружено личных словарей для chatId ${chatId}: ${loaded.length}`)
      }
    } catch (error) {
      console.error(`Ошибка при загрузке личных словарей для ${chatId}:`, error.message)
    }
  }

  // Словарь по умолчанию (если включён, либо ничего личного не выбрано)
  if (includeDefault || parts.length === 0) {
    try {
      const defaultText = await getWordsFromGoogleDocs()
      if (defaultText) {
        const lines = parseDictionaryText(defaultText)
        if (lines.length > 0) {
          parts.push({ name: 'Основной словарь', lines })
          console.log(`Загружен словарь по умолчанию${chatId ? ` для chatId: ${chatId}` : ''}`)
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке словаря по умолчанию:', error.message)
    }
  }

  if (parts.length === 0) {
    console.error('Не удалось загрузить ни один словарь')
    return null
  }

  // Режим порядка слов при нескольких словарях (для одной части не влияет)
  const wordOrder = chatId ? getWordOrder(chatId) : 'sequential'

  // Объединяем слова из всех частей в один список (сквозной индекс)
  const validLines = arrangeWords(parts, wordOrder)

  if (validLines.length === 0) {
    console.error('В выбранных словарях нет корректно отформатированных строк')
    return null
  }

  const isCustom = hasCustom

  // Имя словаря - список названий выбранных частей
  let dictionaryName
  if (parts.length === 1) {
    dictionaryName = parts[0].name
  } else {
    dictionaryName = parts.map(p => p.name).join(' + ')
  }

  logger.log(
    `Словарь успешно обработан. Слов: ${validLines.length}, частей: ${parts.length}, ` +
    `порядок: ${wordOrder} (${isCustom ? 'с личными словарями' : 'по умолчанию'})`
  )

  return {
    dictionary: validLines,
    isCustom,
    totalWords: validLines.length,
    dictionaryName,
    partsCount: parts.length
  }
}

module.exports = {
  getDictionary
}
