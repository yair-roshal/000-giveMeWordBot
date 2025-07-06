const fs = require('fs')
const path = require('path')

const INTERVALS_FILE = path.join(__dirname, '../data/user_intervals.json')

// Интервалы в минутах
const AVAILABLE_INTERVALS = [
  { label: '1 минута', value: 1 },
  { label: '5 минут', value: 5 },
  { label: '10 минут', value: 10 },
  { label: '15 минут', value: 15 },
  { label: '30 минут', value: 30 },
  { label: '1 час', value: 60 },
  { label: '2 часа', value: 120 },
  { label: '4 часа', value: 240 }
]

// Загружаем пользовательские интервалы из файла
function loadUserIntervals() {
  try {
    if (fs.existsSync(INTERVALS_FILE)) {
      const data = fs.readFileSync(INTERVALS_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Ошибка при загрузке пользовательских интервалов:', error)
  }
  return {}
}

// Сохраняем пользовательские интервалы в файл
function saveUserIntervals(userIntervals) {
  try {
    // Создаем директорию, если она не существует
    const dir = path.dirname(INTERVALS_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    fs.writeFileSync(INTERVALS_FILE, JSON.stringify(userIntervals, null, 2))
  } catch (error) {
    console.error('Ошибка при сохранении пользовательских интервалов:', error)
  }
}

// Получаем интервал для конкретного пользователя
function getUserInterval(chatId) {
  const userIntervals = loadUserIntervals()
  return userIntervals[chatId] || null
}

// Устанавливаем интервал для пользователя
function setUserInterval(chatId, intervalMinutes) {
  const userIntervals = loadUserIntervals()
  userIntervals[chatId] = intervalMinutes
  saveUserIntervals(userIntervals)
}

// Получаем все доступные интервалы
function getAvailableIntervals() {
  return AVAILABLE_INTERVALS
}

// Получаем интервал в миллисекундах для пользователя
function getUserIntervalMs(chatId) {
  const intervalMinutes = getUserInterval(chatId)
  if (intervalMinutes) {
    return intervalMinutes * 60 * 1000 // минуты в миллисекунды
  }
  return null
}

module.exports = {
  loadUserIntervals,
  saveUserIntervals,
  getUserInterval,
  setUserInterval,
  getAvailableIntervals,
  getUserIntervalMs
} 