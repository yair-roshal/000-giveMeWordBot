const { getUserIntervalMs, setUserInterval, getUserInterval } = require('./userIntervals.js')

// Хранилище активных таймеров для каждого пользователя
const userTimers = new Map()

// Функция для создания или обновления таймера пользователя
function createOrUpdateUserTimer(chatId, bot, dictionary, currentIndexRef, callback) {
  // Останавливаем существующий таймер, если есть
  if (userTimers.has(chatId)) {
    clearInterval(userTimers.get(chatId))
  }

  // Получаем интервал пользователя
  const userIntervalMs = getUserIntervalMs(chatId)
  
  // Если у пользователя нет настроенного интервала, не создаем таймер
  if (!userIntervalMs) {
    console.log(`Пользователь ${chatId} не настроил интервал`)
    return null
  }

  console.log(`Создаем таймер для пользователя ${chatId} с интервалом ${userIntervalMs / 60000} минут`)

  // Создаем новый таймер
  const timer = setInterval(async () => {
    try {
      await callback(chatId, bot, dictionary, currentIndexRef)
    } catch (error) {
      console.error(`Ошибка в таймере пользователя ${chatId}:`, error)
    }
  }, userIntervalMs)

  // Сохраняем таймер
  userTimers.set(chatId, timer)
  
  return timer
}

// Функция для остановки таймера пользователя
function stopUserTimer(chatId) {
  if (userTimers.has(chatId)) {
    clearInterval(userTimers.get(chatId))
    userTimers.delete(chatId)
    console.log(`Таймер пользователя ${chatId} остановлен`)
  }
}

// Функция для получения информации о таймере пользователя
function getUserTimerInfo(chatId) {
  const hasTimer = userTimers.has(chatId)
  const intervalMinutes = getUserInterval(chatId)
  
  return {
    hasTimer,
    intervalMinutes,
    isActive: hasTimer && intervalMinutes !== null
  }
}

// Функция для остановки всех таймеров
function stopAllTimers() {
  for (const [chatId, timer] of userTimers) {
    clearInterval(timer)
  }
  userTimers.clear()
  console.log('Все пользовательские таймеры остановлены')
}

// Функция для получения списка активных пользователей
function getActiveUsers() {
  return Array.from(userTimers.keys())
}

module.exports = {
  createOrUpdateUserTimer,
  stopUserTimer,
  getUserTimerInfo,
  stopAllTimers,
  getActiveUsers
} 