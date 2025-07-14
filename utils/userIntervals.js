const fs = require('fs')
const path = require('path')

const SETTINGS_FILE = path.join(__dirname, '../data/user_settings.json')

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

function loadUserSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Ошибка при загрузке настроек:', error)
  }
  return {}
}

function saveUserSettings(settings) {
  try {
    const dir = path.dirname(SETTINGS_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2))
  } catch (error) {
    console.error('Ошибка при сохранении настроек:', error)
  }
}

function getUserInterval(chatId) {
  const settings = loadUserSettings()
  return settings[chatId]?.interval || null
}

function setUserInterval(chatId, intervalMinutes) {
  const settings = loadUserSettings()
  const oldValue = settings[chatId]?.interval
  if (!settings[chatId]) settings[chatId] = {}
  settings[chatId].interval = intervalMinutes
  saveUserSettings(settings)
  console.log(`[setUserInterval] chatId: ${chatId}, old: ${oldValue}, new: ${intervalMinutes}`)
}

function getUserIntervalMs(chatId) {
  const intervalMinutes = getUserInterval(chatId)
  if (intervalMinutes) {
    return intervalMinutes * 60 * 1000
  }
  return null
}

module.exports = {
  getUserInterval,
  setUserInterval,
  getUserIntervalMs,
  loadUserSettings,
  saveUserSettings,
  loadUserIntervals: loadUserSettings,
} 