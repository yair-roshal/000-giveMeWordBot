const { getUserIntervalMs, getUserInterval } = require('./userIntervals.js')
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

// Функция для расчета времени до следующей отправки
function calculateNextSendTime(chatId, intervalMs) {
  const period = getUserPeriod(chatId)
  const { start, end } = period
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentSecond = now.getSeconds()

  console.log(`[TIMER][${chatId}] Текущее время: ${currentHour}:${currentMinute}:${currentSecond}`)
  console.log(`[TIMER][${chatId}] Период рассылки: ${start}:00-${end}:00`)
  console.log(`[TIMER][${chatId}] Интервал: ${intervalMs / 60000} минут`)

  // Рассчитываем все времена отправки в течение дня, начиная с start
  const intervalMinutes = intervalMs / 60000
  const sendTimes = []
  let currentSendMinute = start * 60 // Начинаем с начала периода в минутах от полуночи
  const endMinute = end * 60

  while (currentSendMinute < endMinute) {
    const hour = Math.floor(currentSendMinute / 60)
    const minute = currentSendMinute % 60
    sendTimes.push({ hour, minute })
    currentSendMinute += intervalMinutes
  }

  console.log(`[TIMER][${chatId}] Времена отправки сегодня:`, sendTimes.map(t => `${t.hour}:${String(t.minute).padStart(2, '0')}`).join(', '))

  // Текущее время в минутах от полуночи
  const nowMinutes = currentHour * 60 + currentMinute

  // Находим следующее время отправки
  let nextSendTime = null
  for (const time of sendTimes) {
    const sendTimeMinutes = time.hour * 60 + time.minute
    if (sendTimeMinutes > nowMinutes) {
      nextSendTime = time
      break
    }
  }

  // Если не нашли время сегодня, берем первое время завтра
  if (!nextSendTime) {
    nextSendTime = sendTimes[0]
    // Рассчитываем время до завтра
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(nextSendTime.hour, nextSendTime.minute, 0, 0)
    const msUntilNext = tomorrow.getTime() - now.getTime()
    console.log(`[TIMER][${chatId}] Следующая отправка завтра в ${nextSendTime.hour}:${String(nextSendTime.minute).padStart(2, '0')} (через ${Math.round(msUntilNext / 60000)} минут)`)
    return msUntilNext
  }

  // Рассчитываем время до следующей отправки сегодня
  const nextSendDate = new Date(now)
  nextSendDate.setHours(nextSendTime.hour, nextSendTime.minute, 0, 0)
  const msUntilNext = nextSendDate.getTime() - now.getTime()

  console.log(`[TIMER][${chatId}] Следующая отправка сегодня в ${nextSendTime.hour}:${String(nextSendTime.minute).padStart(2, '0')} (через ${Math.round(msUntilNext / 60000)} минут)`)
  return msUntilNext
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

  console.log(`[TIMER][${chatId}] Создаю новый таймер с интервалом ${intervalMs / 60000} минут`)

  // Функция для планирования следующей отправки
  const scheduleNext = () => {
    const msUntilNext = calculateNextSendTime(chatId, intervalMs)

    const timeout = setTimeout(() => {
      console.log(`[TIMER][${chatId}] Время отправки наступило`)

      // Проверяем, что мы в нужном периоде
      const period = getUserPeriod(chatId)
      const { start, end } = period
      const nowHours = new Date().getHours()

      if (nowHours >= start && nowHours < end) {
        console.log(`[TIMER][${chatId}] Отправляем сообщение`)
        callback(chatId, bot, dictionary, currentIndexRef)
      } else {
        console.log(`[TIMER][${chatId}] Пропускаем отправку - вне периода`)
      }

      // Планируем следующую отправку
      scheduleNext()
    }, msUntilNext)

    userTimers.set(chatId, { timeout, interval: null })
    logTimersState('setTimeout', chatId)
  }

  // Запускаем планирование
  scheduleNext()
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