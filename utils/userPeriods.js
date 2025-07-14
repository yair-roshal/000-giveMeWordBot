// utils/userPeriods.js
const fs = require('fs')
const path = require('path')
const { clockStart, clockEnd } = require('../constants/intervals.js')
const PERIODS_FILE = path.join(__dirname, '../data/user_periods.json')

function loadUserPeriods() {
  try {
    if (fs.existsSync(PERIODS_FILE)) {
      const data = fs.readFileSync(PERIODS_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Ошибка при загрузке пользовательских периодов:', error)
  }
  return {}
}
function saveUserPeriods(periods) {
  try {
    const dir = path.dirname(PERIODS_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(PERIODS_FILE, JSON.stringify(periods, null, 2))
  } catch (error) {
    console.error('Ошибка при сохранении пользовательских периодов:', error)
  }
}
function getUserPeriod(chatId) {
  const periods = loadUserPeriods()
  if (periods[chatId]) {
    return periods[chatId]
  } else {
    console.log(`[PERIOD] Для chatId=${chatId} используются дефолтные значения периода: 0-24`)
    return { start: clockStart, end: clockEnd }
  }
}
function setUserPeriod(chatId, start, end) {
  const periods = loadUserPeriods()
  periods[chatId] = { start, end }
  saveUserPeriods(periods)
}

module.exports = { loadUserPeriods, saveUserPeriods, getUserPeriod, setUserPeriod } 