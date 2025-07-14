const fs = require('fs')
const path = require('path')

const SETTINGS_FILE = path.join(__dirname, '../data/user_settings.json')

function loadUserSettings() {
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'))
    } catch (e) {
      return {}
    }
  }
  return {}
}

function saveUserSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2))
}

function getUserIndex(chatId) {
  const settings = loadUserSettings()
  return settings[chatId]?.progress || 0
}

function setUserIndex(chatId, idx) {
  const settings = loadUserSettings()
  if (!settings[chatId]) settings[chatId] = {}
  settings[chatId].progress = idx
  saveUserSettings(settings)
}

module.exports = {
  getUserIndex,
  setUserIndex,
  loadUserProgress: loadUserSettings
} 