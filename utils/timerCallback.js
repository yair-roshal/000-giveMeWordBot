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
      // Получаем текущий индекс и увеличиваем его
      const currentIdx = getUserIndex(chatId) || 0
      const startSearchIdx = currentIdx + 1
      console.log(`[TIMER][DEBUG] chatId=${chatId}: currentIdx=${currentIdx}, startSearchIdx=${startSearchIdx}`)

      // Получаем следующий невыученный индекс
      const nextIdx = await getNextUnlearnedIndex(chatId, startSearchIdx)
      console.log(`[TIMER][DEBUG] chatId=${chatId}: getNextUnlearnedIndex вернул nextIdx=${nextIdx}`)

      // Проверяем, не изменился ли индекс во время поиска (из-за сброса в getDictionary)
      const indexAfterSearch = getUserIndex(chatId)
      if (indexAfterSearch !== currentIdx) {
        console.log(`[TIMER][WARNING] chatId=${chatId}: индекс изменился во время поиска! Был ${currentIdx}, стал ${indexAfterSearch}`)
      }

      // ВАЖНО: Сохраняем индекс ПЕРЕД отправкой сообщения,
      // чтобы избежать race condition при параллельных запросах
      setUserIndex(chatId, nextIdx)
      console.log(`[TIMER] Установлен новый индекс: ${nextIdx} для chatId=${chatId}`)

      console.log(`[TIMER] Вызываем sendWordMessage для chatId=${chatId}, index=${nextIdx}`)
      const result = await sendWordMessage(chatId, nextIdx, bot)
      console.log(`[TIMER] sendWordMessage завершился для chatId=${chatId}, result:`, result)

      if (result && result.leftWords !== undefined) {
        userCurrentOriginal[chatId] = result.leftWords
      } else {
        console.error('[TIMER] sendWordMessage returned invalid result:', result)
        userCurrentOriginal[chatId] = ''
      }
      console.log(`[TIMER] Завершили отправку слова для chatId=${chatId}, новый индекс: ${nextIdx}`)
      
    } catch (err) {
      console.error(`[TIMER] Ошибка в sendWordMessage для chatId=${chatId}:`, err)
    }
  }
}

module.exports = {
  createTimerCallback
}
