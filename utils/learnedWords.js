// utils/learnedWords.js
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

function loadLearnedWords(chatId) {
  const settings = loadUserSettings()
  return settings[chatId]?.learnedWords || []
}

function saveLearnedWords(chatId, words) {
  const settings = loadUserSettings()
  if (!settings[chatId]) settings[chatId] = {}
  settings[chatId].learnedWords = words
  saveUserSettings(settings)
}

function addLearnedWord(chatId, word) {
  const words = loadLearnedWords(chatId)
  if (!words.includes(word)) {
    words.push(word)
    saveLearnedWords(chatId, words)
  }
}

function isWordLearned(chatId, word) {
  const words = loadLearnedWords(chatId)
  return words.includes(word)
}

function clearLearnedWords(chatId) {
  saveLearnedWords(chatId, [])
}

module.exports = {
  loadLearnedWords,
  saveLearnedWords,
  addLearnedWord,
  isWordLearned,
  clearLearnedWords
} 