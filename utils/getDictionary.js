// utils/getDictionary.js
const getWordsFromGoogleDocs = require('./getWordsFromGoogleDocs')
const {
  getSelectedDictionaries,
  fetchSelectedDictionaries
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

  // Объединяем слова из всех частей в один список (сквозной индекс)
  const validLines = parts.reduce((acc, part) => acc.concat(part.lines), [])

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
    `Словарь успешно обработан. Слов: ${validLines.length}, частей: ${parts.length} ` +
    `(${isCustom ? 'с личными словарями' : 'по умолчанию'})`
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
