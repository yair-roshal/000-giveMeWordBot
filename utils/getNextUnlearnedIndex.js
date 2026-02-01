// utils/getNextUnlearnedIndex.js
const { getDictionary } = require('./getDictionary')
const { isWordLearned } = require('./learnedWords')

// Функция для поиска следующего невыученного слова с актуальным словарем
async function getNextUnlearnedIndex(chatId, fromIndex = 0) {
  try {
    // Получаем актуальный словарь для пользователя
    const dictionaryResult = await getDictionary(chatId)
    
    if (!dictionaryResult) {
      console.error(`[UNLEARNED_INDEX] Не удалось загрузить словарь для пользователя ${chatId}`)
      return 0
    }
    
    const { dictionary } = dictionaryResult
    
    if (!dictionary || !dictionary.length) {
      console.error(`[UNLEARNED_INDEX] Пустой словарь для пользователя ${chatId}`)
      return 0
    }
    
    let idx = fromIndex % dictionary.length
    let attempts = 0
    
    while (attempts < dictionary.length) {
      const line = dictionary[idx]
      let original = line
      
      // Извлекаем оригинальное слово из строки
      // Используем первый найденный разделитель, не перезаписываем при нахождении других
      const symbolsArray = ['-', '—', '–', '−']
      for (const symbol of symbolsArray) {
        if (line && line.indexOf(symbol) !== -1) {
          original = line.split(symbol)[0].trim()
          break // Важно: останавливаемся на первом найденном разделителе
        }
      }
      
      // Проверяем, выучено ли это слово
      if (!isWordLearned(chatId, original)) {
        console.log(`[UNLEARNED_INDEX] Найдено невыученное слово для ${chatId}: "${original}" (индекс: ${idx})`)
        return idx
      }
      
      idx = (idx + 1) % dictionary.length
      attempts++
    }
    
    // Если все слова выучены, возвращаем первый индекс
    console.log(`[UNLEARNED_INDEX] Все слова выучены для ${chatId}, возвращаем индекс 0`)
    return 0
    
  } catch (error) {
    console.error(`[UNLEARNED_INDEX] Ошибка при поиске невыученного слова для ${chatId}:`, error.message)
    return 0
  }
}

module.exports = {
  getNextUnlearnedIndex
}
