// Частотность английских слов по готовому frequency list.
//
// Источник: first20hours/google-10000-english, файл 20k.txt
// (Google Trillion Word Corpus frequency list).
// URL: https://raw.githubusercontent.com/first20hours/google-10000-english/master/20k.txt
// Копия лежит в data/frequency/20k.txt — список не пересчитывается,
// ранг слова = номер его строки в файле (1 — самое частотное, 20000 — самое редкое).
//
// Список читается один раз при первом обращении и кэшируется в Map,
// чтобы не грузить 20k строк на каждое отправленное слово.

const fs = require('fs')
const getPathToFolder = require('./getPathToFolder')
const logAlerts = require('./logAlerts')

const FREQUENCY_FILE = 'data/frequency/20k.txt'
const MAX_RANK = 20000

// Границы шкалы частотности: [верхняя граница ранга включительно, подпись].
const FREQUENCY_SCALE = [
  [1000, '🟢 очень частотное'],
  [3000, '🟢 частотное'],
  [5000, '🟡 достаточно частотное'],
  [10000, '🟠 менее частотное'],
  [MAX_RANK, '🔴 редкое'],
]

let frequencyMap = null

// Приводим слово к ключу списка: регистр и внешняя пунктуация не должны
// мешать поиску («Extent», «EXTENT», «extent.» — одно и то же слово).
function normalizeWord(word) {
  if (typeof word !== 'string') return ''
  return word
    .trim()
    .toLowerCase()
    .replace(/^[^a-z']+|[^a-z']+$/g, '')
}

function loadFrequencyMap() {
  if (frequencyMap) return frequencyMap

  frequencyMap = new Map()

  try {
    const pathFile = getPathToFolder(FREQUENCY_FILE)
    const data = fs.readFileSync(pathFile, 'utf8')

    data.split('\n').forEach((line, index) => {
      const word = line.trim().toLowerCase()
      // Первое вхождение выигрывает: оно и есть самый высокий ранг слова.
      if (word && !frequencyMap.has(word)) {
        frequencyMap.set(word, index + 1)
      }
    })
  } catch (err) {
    console.error(`Error reading frequency file ${FREQUENCY_FILE}:`, err)
    logAlerts(err)
  }

  return frequencyMap
}

// Ранг слова от 1 до 20000, либо null — если слова нет в top 20 000.
function getFrequencyRank(word) {
  const normalized = normalizeWord(word)
  if (!normalized) return null

  return loadFrequencyMap().get(normalized) ?? null
}

// Текстовая метка шкалы для ранга.
function getFrequencyLabel(rank) {
  if (rank === null || rank === undefined) return '⚪️ не входит в top 20 000'

  const level = FREQUENCY_SCALE.find(([maxRank]) => rank <= maxRank)
  return level ? level[1] : '⚪️ не входит в top 20 000'
}

// Готовая строка для сообщения бота, либо '' — если слово не английское
// или в списке его нет (тогда строку в сообщение не добавляем).
function formatFrequencyLine(word) {
  const rank = getFrequencyRank(word)
  if (rank === null) return ''

  const formattedRank = rank.toLocaleString('en-US')
  const formattedMax = MAX_RANK.toLocaleString('en-US')

  return `Frequency: #${formattedRank} / ${formattedMax} — ${getFrequencyLabel(rank)}`
}

module.exports = {
  getFrequencyRank,
  getFrequencyLabel,
  formatFrequencyLine,
  normalizeWord,
  MAX_RANK,
}
