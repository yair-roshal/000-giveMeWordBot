const fs = require('fs')
const path = require('path')

function getFilePath(chatId) {
  return path.join(__dirname, `../data/learned_words_${chatId}.json`)
}

function loadLearnedWords(chatId) {
  const file = getFilePath(chatId)
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch (e) {
      return []
    }
  }
  return []
}

function saveLearnedWords(chatId, words) {
  const file = getFilePath(chatId)
  fs.writeFileSync(file, JSON.stringify(words, null, 2))
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