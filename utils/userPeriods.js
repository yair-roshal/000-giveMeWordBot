// utils/userPeriods.js
const fs = require('fs')
const path = require('path')
const { clockStart, clockEnd } = require('../constants/intervals.js')
const SETTINGS_FILE = path.join(__dirname, '../data/user_settings.json')

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
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2))
  } catch (error) {
    console.error('Ошибка при сохранении настроек:', error)
  }
}
function getUserPeriod(chatId) {
  const settings = loadUserSettings()
  if (settings[chatId]?.period) {
    return settings[chatId].period
  } else {
    console.log(`[PERIOD] Для chatId=${chatId} используются дефолтные значения периода: 0-24`)
    return { start: clockStart, end: clockEnd }
  }
}
function setUserPeriod(chatId, start, end) {
  const settings = loadUserSettings()
  if (!settings[chatId]) settings[chatId] = {}
  settings[chatId].period = { start, end }
  saveUserSettings(settings)
}

module.exports = { getUserPeriod, setUserPeriod } 