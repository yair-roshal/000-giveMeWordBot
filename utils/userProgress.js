const fs = require('fs')
const path = require('path')

const PROGRESS_FILE = path.join(__dirname, '../data/user_progress.json')

function loadUserProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))
    } catch (e) {
      return {}
    }
  }
  return {}
}

function saveUserProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
}

function getUserIndex(chatId) {
  const progress = loadUserProgress()
  return progress[chatId] || 0
}

function setUserIndex(chatId, idx) {
  const progress = loadUserProgress()
  progress[chatId] = idx
  saveUserProgress(progress)
}

module.exports = {
  loadUserProgress,
  saveUserProgress,
  getUserIndex,
  setUserIndex
} 