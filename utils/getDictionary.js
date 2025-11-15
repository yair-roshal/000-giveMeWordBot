// utils/getDictionary.js
const getWordsFromGoogleDocs = require('./getWordsFromGoogleDocs')
const { fetchUserDictionary, getUserDictionary, extractGoogleDocId, getGoogleDocTitle, updateUserDictionaryWordCount } = require('./userDictionaries')
const { setUserIndex, getUserIndex } = require('./userProgress')

// Функция для получения словаря (пользовательского или по умолчанию)
async function getDictionary(chatId = null) {
  let dictionaryText = null
  let isCustom = false

  // Сначала пробуем загрузить пользовательский словарь
  if (chatId) {
    try {
      const userDictionaryText = await fetchUserDictionary(chatId)
      if (userDictionaryText) {
        dictionaryText = userDictionaryText
        isCustom = true
        console.log(`Загружен пользовательский словарь для chatId: ${chatId}`)
      }
    } catch (error) {
      console.error(`Ошибка при загрузке пользовательского словаря для ${chatId}:`, error.message)
    }
  }
  
  // Если пользовательский словарь не загрузился, используем словарь по умолчанию
  if (!dictionaryText) {
    try {
      dictionaryText = await getWordsFromGoogleDocs()
      if (dictionaryText) {
        console.log(`Загружен словарь по умолчанию${chatId ? ` для chatId: ${chatId}` : ''}`)
      }
    } catch (error) {
      console.error('Ошибка при загрузке словаря по умолчанию:', error.message)
    }
  }
  
  if (!dictionaryText) {
    console.error('Не удалось загрузить ни один словарь')
    return null
  }
  
  // Обрабатываем и фильтруем словарь
  const processedDictionary = dictionaryText.split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('🇮🇱') && !line.startsWith('___'))
  
  if (!Array.isArray(processedDictionary) || processedDictionary.length === 0) {
    console.error('Получен невалидный словарь:', {
      isArray: Array.isArray(processedDictionary),
      length: processedDictionary?.length,
      isCustom
    })
    return null
  }
  
  // Проверяем формат строк словаря
  const validLines = processedDictionary.filter(line => {
    const hasValidSeparator = ['-', '—', '–', '—', '−'].some(sep => line.includes(sep))
    return hasValidSeparator
  })
  
  if (validLines.length === 0) {
    console.error('В словаре нет корректно отформатированных строк')
    return null
  }
  
  // Определяем имя словаря
  let dictionaryName = 'Основной словарь'
  if (isCustom && chatId) {
    try {
      // Получаем данные пользовательского словаря
      const userDict = getUserDictionary(chatId)
      if (userDict) {
        // Используем кэшированное название, если есть
        if (userDict.title) {
          dictionaryName = userDict.title
        } else if (userDict.url) {
          // Если названия нет в кэше, получаем его и сохраняем
          const docId = extractGoogleDocId(userDict.url)
          if (docId) {
            dictionaryName = await getGoogleDocTitle(docId)
            // Обновляем кэш
            const dictionaries = require('./userDictionaries').loadUserDictionaries()
            dictionaries[chatId].title = dictionaryName
            require('./userDictionaries').saveUserDictionaries(dictionaries)
          } else {
            dictionaryName = 'Пользовательский словарь'
          }
        } else {
          dictionaryName = 'Пользовательский словарь'
        }
      } else {
        dictionaryName = 'Пользовательский словарь'
      }
    } catch (error) {
      console.error(`Ошибка при получении названия словаря для ${chatId}:`, error.message)
      dictionaryName = 'Пользовательский словарь'
    }
  }
  
  console.log(`Словарь успешно обработан. Количество слов: ${validLines.length} (${isCustom ? 'пользовательский' : 'по умолчанию'})`)

  // Проверка изменений в словаре для пользовательских словарей
  if (isCustom && chatId) {
    const userDict = getUserDictionary(chatId)
    if (userDict) {
      const previousWordCount = userDict.wordCount || 0
      const currentWordCount = validLines.length

      // Если количество слов увеличилось (добавлены новые слова)
      if (currentWordCount > previousWordCount) {
        const newWordsAdded = currentWordCount - previousWordCount
        console.log(`[DICTIONARY_UPDATE] Обнаружены новые слова в словаре пользователя ${chatId}`)
        console.log(`[DICTIONARY_UPDATE] Было слов: ${previousWordCount}, стало: ${currentWordCount}, добавлено: ${newWordsAdded}`)
        console.log(`[DICTIONARY_UPDATE] Сбрасываем индекс пользователя ${chatId} с ${getUserIndex(chatId)} на 0`)

        // Сбрасываем индекс пользователя на 0
        setUserIndex(chatId, 0)

        // Обновляем сохраненное количество слов
        updateUserDictionaryWordCount(chatId, currentWordCount)

        console.log(`[DICTIONARY_UPDATE] Индекс успешно сброшен на 0, словарь обновлен`)
      } else if (currentWordCount !== previousWordCount) {
        // Если количество изменилось (уменьшилось или стало другим), обновляем счетчик
        console.log(`[DICTIONARY_UPDATE] Количество слов изменилось для пользователя ${chatId}: ${previousWordCount} -> ${currentWordCount}`)
        updateUserDictionaryWordCount(chatId, currentWordCount)
      }
    }
  }

  return {
    dictionary: validLines,
    isCustom,
    totalWords: validLines.length,
    dictionaryName
  }
}

module.exports = {
  getDictionary
}
