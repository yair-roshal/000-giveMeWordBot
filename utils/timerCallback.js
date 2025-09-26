// utils/timerCallback.js
const { sendWordMessage } = require('./sendWordMessage')
const { getNextUnlearnedIndex } = require('./getNextUnlearnedIndex')
const { setUserIndex, getUserIndex } = require('./userProgress')
const formatDate = require('./formatDate')

// Callback функция для таймеров с поддержкой пользовательских словарей
async function createTimerCallback(userCurrentOriginal) {
  return async (chatId, bot) => {
    const timestamp = Date.now()
    const formattedDate = formatDate(timestamp)
    console.log(`[TIMER] Отправляем слово пользователю ${chatId} в ${formattedDate}`)
    
    try {
      // Получаем следующий невыученный индекс
      const nextIdx = await getNextUnlearnedIndex(chatId, (getUserIndex(chatId) || 0) + 1)
      
      console.log(`[TIMER] Вызываем sendWordMessage для chatId=${chatId}, index=${nextIdx}`)
      const result = await sendWordMessage(chatId, nextIdx, bot)
      console.log(`[TIMER] sendWordMessage завершился для chatId=${chatId}, result:`, result)
      
      if (result && result.leftWords !== undefined) {
        userCurrentOriginal[chatId] = result.leftWords
      } else {
        console.error('[TIMER] sendWordMessage returned invalid result:', result)
        userCurrentOriginal[chatId] = ''
      }
      
      // Обновляем индекс пользователя
      setUserIndex(chatId, nextIdx)
      console.log(`[TIMER] Завершили отправку слова для chatId=${chatId}, новый индекс: ${nextIdx}`)
      
    } catch (err) {
      console.error(`[TIMER] Ошибка в sendWordMessage для chatId=${chatId}:`, err)
    }
  }
}

module.exports = {
  createTimerCallback
}
