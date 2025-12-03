// utils/logger.js

function formatLogDate() {
  const date = new Date()
  
  const options = {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }
  
  const formatter = new Intl.DateTimeFormat("en-GB", options)
  const parts = formatter.formatToParts(date)
  
  const year = parts.find(p => p.type === 'year').value
  const month = parts.find(p => p.type === 'month').value
  const day = parts.find(p => p.type === 'day').value
  const hour = parts.find(p => p.type === 'hour').value
  const minute = parts.find(p => p.type === 'minute').value
  const second = parts.find(p => p.type === 'second').value
  
  return `${year}-${month}-${day}_${hour}:${minute}:${second}`
}

function log(...args) {
  const dateFormatted = formatLogDate()
  console.log(dateFormatted + ':', ...args)
}

function error(...args) {
  const dateFormatted = formatLogDate()
  console.error(dateFormatted + ':', ...args)
}

module.exports = { log, error }

