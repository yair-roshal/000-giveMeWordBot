const { getUserIntervalMs, setUserInterval, getUserInterval } = require('./userIntervals.js')
const { getUserPeriod } = require('./userPeriods.js')
const { min } = require('../constants/intervals.js')

// Хранилище активных таймеров для каждого пользователя
const userTimers = new Map()

function normalizeChatId(chatId) {
  return String(chatId)
}

function logTimersState(action, chatId) {
  const allChatIds = Array.from(userTimers.keys())
  console.log(`[TIMER][${chatId}] [${action}] Активных таймеров: ${userTimers.size}. Список chatId:`, allChatIds)
}

// Функция для создания или обновления таймера пользователя
function createOrUpdateUserTimer(chatId, bot, dictionary, currentIndexRef, callback) {
  chatId = normalizeChatId(chatId)
  console.log(`[TIMER][${chatId}] createOrUpdateUserTimer вызван`)
  if (userTimers.has(chatId)) {
    const timers = userTimers.get(chatId)
    console.log(`[TIMER][${chatId}] Останавливаю старый таймер`)
    if (timers.timeout) clearTimeout(timers.timeout)
    if (timers.interval) clearInterval(timers.interval)
    userTimers.delete(chatId)
    logTimersState('delete', chatId)
  }

  // Получаем интервал пользователя
  const userIntervalMs = getUserIntervalMs(chatId)
  const defaultIntervalMs = min * 60 * 1000 // Используем значение из constants/intervals.js
  if (!userIntervalMs) {
    console.log(`[TIMER][${chatId}] Не настроен интервал, используем дефолт ${min} минут`)
  }
  const intervalMs = userIntervalMs || defaultIntervalMs

  console.log(`[TIMER][${chatId}] Создаю новый таймер с интервалом ${intervalMs / 60000} минут (отложенный старт)`)

  // Первый запуск только через userIntervalMs
  const timeout = setTimeout(() => {
    console.log(`[TIMER][${chatId}] setTimeout сработал`)
    // Всегда запускаем setInterval
    const interval = setInterval(() => {
      console.log(`[TIMER][${chatId}] Проверка времени`)
      const period = getUserPeriod(chatId)
      console.log('[DEBUG] getUserPeriod вернул:', period)
      const { start, end } = period
      const nowHours = new Date().getHours()
      if (!(nowHours >= start && nowHours < end)) {
        console.log(`[TIMER][${chatId}] Не время показа слова: сейчас ${nowHours}:00, разрешено ${start}:00-${end}:00 (chatId=${chatId})`)
        return
      }
      console.log(`[TIMER][${chatId}] Периодический запуск`)
      console.log(`[TIMER][${chatId}] Вызываем callback`)
      callback(chatId, bot, dictionary, currentIndexRef)
    }, intervalMs)
    userTimers.set(chatId, { timeout, interval })
    logTimersState('setInterval', chatId)

    // Первый запуск (отложенный)
    console.log(`[TIMER][${chatId}] Проверка времени (первый запуск)`)
    const period = getUserPeriod(chatId)
    console.log('[DEBUG] getUserPeriod вернул:', period)
    const { start, end } = period
    const nowHours = new Date().getHours()
    if (!(nowHours >= start && nowHours < end)) {
      console.log(`[TIMER][${chatId}] Не время показа слова: сейчас ${nowHours}:00, разрешено ${start}:00-${end}:00 (chatId=${chatId})`)
      return
    }
    console.log(`[TIMER][${chatId}] Первый запуск`)
    console.log(`[TIMER][${chatId}] Вызываем callback (первый запуск)`)
    callback(chatId, bot, dictionary, currentIndexRef)
  }, intervalMs)

  // Записываем таймер сразу после создания timeout
  userTimers.set(chatId, { timeout, interval: null })
  logTimersState('setTimeout', chatId)
  return timeout
}

// Функция для остановки таймера пользователя
function stopUserTimer(chatId) {
  chatId = normalizeChatId(chatId)
  if (userTimers.has(chatId)) {
    const timers = userTimers.get(chatId)
    if (timers.timeout) clearTimeout(timers.timeout)
    if (timers.interval) clearInterval(timers.interval)
    userTimers.delete(chatId)
    console.log(`Таймер пользователя ${chatId} остановлен`)
    logTimersState('delete', chatId)
  }
}

// Функция для получения информации о таймере пользователя
function getUserTimerInfo(chatId) {
  chatId = normalizeChatId(chatId)
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