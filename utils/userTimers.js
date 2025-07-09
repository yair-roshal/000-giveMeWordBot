const { getUserIntervalMs, setUserInterval, getUserInterval } = require('./userIntervals.js')

// Хранилище активных таймеров для каждого пользователя
const userTimers = new Map()

// Функция для создания или обновления таймера пользователя
function createOrUpdateUserTimer(chatId, bot, dictionary, currentIndexRef, callback) {
  // Останавливаем существующий таймер, если есть
  if (userTimers.has(chatId)) {
    const timers = userTimers.get(chatId)
    if (timers.timeout) clearTimeout(timers.timeout)
    if (timers.interval) clearInterval(timers.interval)
    userTimers.delete(chatId)
  }

  // Получаем интервал пользователя
  const userIntervalMs = getUserIntervalMs(chatId)
  if (!userIntervalMs) {
    console.log(`Пользователь ${chatId} не настроил интервал`)
    return null
  }

  console.log(`Создаём таймер для пользователя ${chatId} с интервалом ${userIntervalMs / 60000} минут (отложенный старт)`)

  // Первый запуск только через userIntervalMs
  const timeout = setTimeout(() => {
    console.log(`[TIMER] Первый запуск для chatId=${chatId}`)
    callback(chatId, bot, dictionary, currentIndexRef)
    const interval = setInterval(() => {
      console.log(`[TIMER] Периодический запуск для chatId=${chatId}`)
      callback(chatId, bot, dictionary, currentIndexRef)
    }, userIntervalMs)
    userTimers.set(chatId, { timeout, interval })
  }, userIntervalMs)

  userTimers.set(chatId, { timeout, interval: null })
  return timeout
}

// Функция для остановки таймера пользователя
function stopUserTimer(chatId) {
  if (userTimers.has(chatId)) {
    const timers = userTimers.get(chatId)
    if (timers.timeout) clearTimeout(timers.timeout)
    if (timers.interval) clearInterval(timers.interval)
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
  for (const [chatId, timers] of userTimers) {
    if (timers.timeout) clearTimeout(timers.timeout)
    if (timers.interval) clearInterval(timers.interval)
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