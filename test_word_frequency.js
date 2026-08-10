// Тесты частотности слов: node test_word_frequency.js
// Проверяем ранги, нормализацию регистра и слова вне top 20 000.

const {
  getFrequencyRank,
  getFrequencyLabel,
  formatFrequencyLine,
  MAX_RANK,
} = require('./utils/wordFrequency.js')

let passed = 0
let failed = 0

function check(name, actual, expected) {
  const ok = actual === expected
  if (ok) {
    passed++
    console.log(`✅ ${name}`)
  } else {
    failed++
    console.log(`❌ ${name}\n   ожидалось: ${JSON.stringify(expected)}\n   получено:  ${JSON.stringify(actual)}`)
  }
}

console.log('\n=== Ранги известных слов ===')
check('the → 1', getFrequencyRank('the'), 1)
check('of → 2', getFrequencyRank('of'), 2)
check('and → 3', getFrequencyRank('and'), 3)
check('extent → 3090', getFrequencyRank('extent'), 3090)

console.log('\n=== Нормализация регистра ===')
const lower = getFrequencyRank('extent')
check('Extent === extent', getFrequencyRank('Extent'), lower)
check('EXTENT === extent', getFrequencyRank('EXTENT'), lower)
check('  Extent  === extent', getFrequencyRank('  Extent  '), lower)
check('extent. === extent', getFrequencyRank('extent.'), lower)

console.log('\n=== Слова вне top 20 000 ===')
check('someRareWord → null', getFrequencyRank('someRareWord'), null)
check('пустая строка → null', getFrequencyRank(''), null)
check('undefined → null', getFrequencyRank(undefined), null)
check('не-строка → null', getFrequencyRank(42), null)
check('русское слово → null', getFrequencyRank('слово'), null)

console.log('\n=== Границы списка ===')
const lastRank = getFrequencyRank(require('fs')
  .readFileSync(require('path').join(__dirname, 'data/frequency/20k.txt'), 'utf8')
  .split('\n')
  .filter((line) => line.trim())
  .pop()
  .trim())
check('последнее слово файла имеет ранг 20000', lastRank, MAX_RANK)

console.log('\n=== Шкала частотности ===')
check('rank 1 → очень частотное', getFrequencyLabel(1), '🟢 очень частотное')
check('rank 1000 → очень частотное', getFrequencyLabel(1000), '🟢 очень частотное')
check('rank 1001 → частотное', getFrequencyLabel(1001), '🟢 частотное')
check('rank 3090 → достаточно частотное', getFrequencyLabel(3090), '🟡 достаточно частотное')
check('rank 7000 → менее частотное', getFrequencyLabel(7000), '🟠 менее частотное')
check('rank 20000 → редкое', getFrequencyLabel(20000), '🔴 редкое')
check('null → вне top 20 000', getFrequencyLabel(null), '⚪️ не входит в top 20 000')

console.log('\n=== Строка для сообщения ===')
check(
  'extent → форматированная строка',
  formatFrequencyLine('extent'),
  'Frequency: #3,090 / 20,000 — 🟡 достаточно частотное',
)
check('the → форматированная строка', formatFrequencyLine('the'), 'Frequency: #1 / 20,000 — 🟢 очень частотное')
check('слово вне списка → пустая строка', formatFrequencyLine('someRareWord'), '')

console.log(`\n=== Итог: ${passed} passed, ${failed} failed ===\n`)
process.exit(failed > 0 ? 1 : 0)
