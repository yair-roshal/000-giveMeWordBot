// utils/sendWordMessage.js
const { getDictionary } = require('./getDictionary')
const sendingWordMessage = require('./prepareMessage')

// Функция-обертка для отправки слова с актуальным словарем пользователя
async function sendWordMessage(chatId, wordIndex, bot) {
  try {
    console.log(`[SEND_WORD] Загружаем словарь для пользователя ${chatId}`)
    
    // Получаем актуальный словарь для пользователя
    const dictionaryResult = await getDictionary(chatId)
    
    if (!dictionaryResult) {
      console.error(`[SEND_WORD] Не удалось загрузить словарь для пользователя ${chatId}`)
      throw new Error('Не удалось загрузить словарь')
    }
    
    const { dictionary, isCustom } = dictionaryResult
    console.log(`[SEND_WORD] Используем ${isCustom ? 'пользовательский' : 'стандартный'} словарь. Слов: ${dictionary.length}`)
    
    // Проверяем валидность индекса
    if (wordIndex < 0 || wordIndex >= dictionary.length) {
      console.log(`[SEND_WORD] Индекс ${wordIndex} вне диапазона, сбрасываем на 0`)
      wordIndex = 0
    }
    
    // Отправляем слово используя актуальный словарь
    const result = await sendingWordMessage(dictionary, wordIndex, bot, chatId)
    
    console.log(`[SEND_WORD] Слово отправлено пользователю ${chatId}, индекс: ${wordIndex}`)
    return result
    
  } catch (error) {
    console.error(`[SEND_WORD] Ошибка при отправке слова пользователю ${chatId}:`, error.message)
    throw error
  }
}

module.exports = {
  sendWordMessage
}
