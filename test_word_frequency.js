// Тесты частотности слов: node test_word_frequency.js
// Проверяем два независимых рейтинга, лемматизацию и нормализацию.

const {
  getFrequencyRanks,
  getFrequencyLabel,
  formatFrequencyLine,
  normalizeWord,
  COCA_TOTAL,
  SUBTLEX_TOTAL,
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

// Ранги привязаны к версии корпуса, поэтому известные слова проверяем диапазоном.
function checkRange(name, actual, min, max) {
  const ok = typeof actual === 'number' && actual >= min && actual <= max
  if (ok) {
    passed++
    console.log(`✅ ${name} (#${actual})`)
  } else {
    failed++
    console.log(`❌ ${name}\n   ожидалось: #${min}..#${max}\n   получено:  ${JSON.stringify(actual)}`)
  }
}

console.log('\n=== Верх обоих рейтингов ===')
check('the → #1 в COCA', getFrequencyRanks('the').coca, 1)
checkRange('the в субтитрах — в первой десятке', getFrequencyRanks('the').subtlex, 1, 10)
checkRange('go — ядро языка (COCA)', getFrequencyRanks('go').coca, 1, 100)

console.log('\n=== Рейтинги независимы и не смешиваются ===')
// Разговорное слово в субтитрах выше, чем в письменном корпусе, — и наоборот.
const hungry = getFrequencyRanks('hungry')
check('hungry в субтитрах выше, чем в COCA', hungry.subtlex < hungry.coca, true)
const extent = getFrequencyRanks('extent')
check('extent — книжное, в COCA выше', extent.coca < extent.subtlex, true)
check('login: нет в COCA', getFrequencyRanks('login').coca, null)
check('login: есть в субтитрах', getFrequencyRanks('login').subtlex !== null, true)

console.log('\n=== Регресс: перекос вебового списка исправлен ===')
// В google-10000-english login=541 был «частотнее» hungry=8710. Так быть не должно.
check('hungry частотнее login (субтитры)', hungry.subtlex < getFrequencyRanks('login').subtlex, true)
check(
  'bread частотнее password (субтитры)',
  getFrequencyRanks('bread').subtlex < getFrequencyRanks('password').subtlex,
  true,
)

console.log('\n=== Регресс: инфинитивы находятся (лемматизация) ===')
// Раньше отсутствовали в списке как класс — были только формы на -ed/-ing.
check('confuse найдено в COCA', getFrequencyRanks('confuse').coca !== null, true)
check('skew найдено через skewed', getFrequencyRanks('skew').subtlex !== null, true)
check('teach найдено в COCA', getFrequencyRanks('teach').coca !== null, true)

console.log('\n=== Лемматизация правильных форм ===')
check('studied → лемма в COCA', getFrequencyRanks('studied').coca !== null, true)
check('running → лемма в COCA', getFrequencyRanks('running').coca !== null, true)
check('flies → лемма в COCA', getFrequencyRanks('flies').coca !== null, true)
check('stopped → лемма (удвоенная согласная)', getFrequencyRanks('stopped').coca !== null, true)

console.log('\n=== Лемматизация неправильных форм ===')
check('taught → teach', getFrequencyRanks('taught').coca, getFrequencyRanks('teach').coca)
check('went → go', getFrequencyRanks('went').coca, getFrequencyRanks('go').coca)
check('children → child', getFrequencyRanks('children').coca, getFrequencyRanks('child').coca)
check('bought → buy', getFrequencyRanks('bought').coca, getFrequencyRanks('buy').coca)
// Степени сравнения — самостоятельные леммы COCA, а не формы «good».
check('best — свой ранг, не ранг good', getFrequencyRanks('best').coca !== getFrequencyRanks('good').coca, true)
check('best найдено', getFrequencyRanks('best').coca !== null, true)

console.log('\n=== Нормализация регистра ===')
const lower = getFrequencyRanks('extent').coca
check('Extent === extent', getFrequencyRanks('Extent').coca, lower)
check('EXTENT === extent', getFrequencyRanks('EXTENT').coca, lower)
check('  Extent  === extent', getFrequencyRanks('  Extent  ').coca, lower)
check('extent. === extent', getFrequencyRanks('extent.').coca, lower)
check('normalizeWord обрезает пунктуацию', normalizeWord('  Extent.  '), 'extent')

console.log('\n=== Слова вне списков ===')
check('xyzzy → нет в COCA', getFrequencyRanks('xyzzy').coca, null)
check('xyzzy → нет в субтитрах', getFrequencyRanks('xyzzy').subtlex, null)
check('пустая строка → null', getFrequencyRanks('').coca, null)
check('undefined → null', getFrequencyRanks(undefined).coca, null)
check('не-строка → null', getFrequencyRanks(42).coca, null)
check('русское слово → null', getFrequencyRanks('слово').coca, null)

console.log('\n=== Шкала частотности ===')
check('#1 → очень частотное', getFrequencyLabel(1), '🟢 очень частотное')
check('#1000 → очень частотное', getFrequencyLabel(1000), '🟢 очень частотное')
check('#1001 → частотное', getFrequencyLabel(1001), '🟢 частотное')
check('#4000 → достаточно частотное', getFrequencyLabel(4000), '🟡 достаточно частотное')
check('#8000 → менее частотное', getFrequencyLabel(8000), '🟠 менее частотное')
check('#40000 → редкое', getFrequencyLabel(40000), '🔴 редкое')
check('null → нет в списке', getFrequencyLabel(null), '⚪️ нет в списке')

console.log('\n=== Строка для сообщения ===')
check(
  'the → обе строки с номерами',
  formatFrequencyLine('the'),
  `COCA (книги, пресса, речь): #1 / ${COCA_TOTAL.toLocaleString('en-US')} — 🟢 очень частотное\n` +
    `Субтитры (разговорная речь): #3 / ${SUBTLEX_TOTAL.toLocaleString('en-US')} — 🟢 очень частотное`,
)
check(
  'login → пометка об отсутствии в COCA',
  formatFrequencyLine('login').split('\n')[0],
  'COCA (книги, пресса, речь): ⚪️ нет в списке',
)
check('слово вне обоих списков → пустая строка', formatFrequencyLine('xyzzy'), '')
check('русское слово → пустая строка', formatFrequencyLine('слово'), '')

console.log(`\n=== Итог: ${passed} passed, ${failed} failed ===\n`)
process.exit(failed > 0 ? 1 : 0)
