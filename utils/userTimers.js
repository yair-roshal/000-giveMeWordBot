const { getUserIntervalMs, setUserInterval, getUserInterval } = require('./userIntervals.js')
const { getUserPeriod } = require('./userPeriods.js')

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
    console.log(`Пользователь ${chatId} не настроил интервал, используем дефолт 120 минут`)
  }
  const intervalMs = userIntervalMs || (120 * 60 * 1000) // 120 минут в миллисекундах

  console.log(`Создаём таймер для пользователя ${chatId} с интервалом ${intervalMs / 60000} минут (отложенный старт)`)

  // Первый запуск только через userIntervalMs
  const timeout = setTimeout(() => {
    console.log(`[TIMER] setTimeout сработал для chatId=${chatId}`)
    // Всегда запускаем setInterval
    const interval = setInterval(() => {
      console.log(`[TIMER] Проверка времени для chatId=${chatId}`)
      const period = getUserPeriod(chatId)
      console.log('[DEBUG] getUserPeriod вернул:', period)
      const { start, end } = period
      const nowHours = new Date().getHours()
      if (!(nowHours >= start && nowHours < end)) {
        console.log(`[TIMER] Не время показа слова: сейчас ${nowHours}:00, разрешено ${start}:00-${end}:00 (chatId=${chatId})`)
        return
      }
      console.log(`[TIMER] Периодический запуск для chatId=${chatId}`)
      console.log(`[TIMER] Вызываем callback для chatId=${chatId}`)
      callback(chatId, bot, dictionary, currentIndexRef)
    }, intervalMs)
    userTimers.set(chatId, { timeout, interval: interval })

    // Первый запуск (отложенный)
    console.log(`[TIMER] Проверка времени для chatId=${chatId} (первый запуск)`)
    const period = getUserPeriod(chatId)
    console.log('[DEBUG] getUserPeriod вернул:', period)
    const { start, end } = period
    const nowHours = new Date().getHours()
    if (!(nowHours >= start && nowHours < end)) {
      console.log(`[TIMER] Не время показа слова: сейчас ${nowHours}:00, разрешено ${start}:00-${end}:00 (chatId=${chatId})`)
      return
    }
    console.log(`[TIMER] Первый запуск для chatId=${chatId}`)
    console.log(`[TIMER] Вызываем callback для chatId=${chatId} (первый запуск)`)
    callback(chatId, bot, dictionary, currentIndexRef)
  }, intervalMs)

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