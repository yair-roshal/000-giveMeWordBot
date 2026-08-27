// Тесты частотности слов: node test_word_frequency.js
// Проверяем Zipf-баллы, лемматизацию, приоритет корпусов и нормализацию.

const {
  getFrequencyInfo,
  getFrequencyZipf,
  getFrequencyLabel,
  formatFrequencyLine,
  normalizeWord,
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

// Zipf — непрерывная величина, поэтому известные слова проверяем диапазоном.
function checkRange(name, actual, min, max) {
  const ok = typeof actual === 'number' && actual >= min && actual <= max
  if (ok) {
    passed++
    console.log(`✅ ${name} (${actual})`)
  } else {
    failed++
    console.log(`❌ ${name}\n   ожидалось: ${min}..${max}\n   получено:  ${JSON.stringify(actual)}`)
  }
}

console.log('\n=== Zipf известных слов ===')
checkRange('the — служебное, ~7.7', getFrequencyZipf('the'), 7.0, 8.0)
checkRange('go — ядро языка', getFrequencyZipf('go'), 5.5, 7.0)
checkRange('mother — обиходное', getFrequencyZipf('mother'), 5.0, 6.0)
checkRange('bread — обиходное', getFrequencyZipf('bread'), 4.0, 5.5)
checkRange('nevertheless — книжное', getFrequencyZipf('nevertheless'), 3.5, 5.0)

console.log('\n=== Регресс: перекос вебового списка исправлен ===')
// В google-10000-english login=541 был «частотнее» hungry=8710. Так быть не должно.
const hungry = getFrequencyZipf('hungry')
const login = getFrequencyZipf('login')
check('hungry частотнее login', hungry > login, true)
check('bread частотнее password', getFrequencyZipf('bread') > getFrequencyZipf('password'), true)
check('mother частотнее download', getFrequencyZipf('mother') > getFrequencyZipf('download'), true)

console.log('\n=== Регресс: инфинитивы находятся (лемматизация) ===')
// Раньше отсутствовали в списке как класс — были только формы на -ed/-ing.
check('confuse найдено', getFrequencyZipf('confuse') !== null, true)
check('skew найдено (через skewed)', getFrequencyZipf('skew') !== null, true)
check('teach найдено', getFrequencyZipf('teach') !== null, true)

console.log('\n=== Лемматизация словоформ ===')
check('taught найдено', getFrequencyZipf('taught') !== null, true)
check('studied найдено', getFrequencyZipf('studied') !== null, true)
check('running найдено', getFrequencyZipf('running') !== null, true)
check('flies найдено', getFrequencyZipf('flies') !== null, true)
check('stopped найдено (удвоенная согласная)', getFrequencyZipf('stopped') !== null, true)

console.log('\n=== Приоритет корпусов ===')
check('ядро языка идёт из COCA', getFrequencyInfo('mother').source, 'COCA')
check('хвост идёт из SUBTLEX', getFrequencyInfo('skew').source, 'SUBTLEX')

console.log('\n=== Нормализация регистра ===')
const lower = getFrequencyZipf('extent')
check('Extent === extent', getFrequencyZipf('Extent'), lower)
check('EXTENT === extent', getFrequencyZipf('EXTENT'), lower)
check('  Extent  === extent', getFrequencyZipf('  Extent  '), lower)
check('extent. === extent', getFrequencyZipf('extent.'), lower)
check('normalizeWord обрезает пунктуацию', normalizeWord('  Extent.  '), 'extent')

console.log('\n=== Слова вне списков ===')
check('xyzzy → null', getFrequencyZipf('xyzzy'), null)
check('пустая строка → null', getFrequencyZipf(''), null)
check('undefined → null', getFrequencyZipf(undefined), null)
check('не-строка → null', getFrequencyZipf(42), null)
check('русское слово → null', getFrequencyZipf('слово'), null)

console.log('\n=== Шкала частотности ===')
check('7.7 → очень частотное', getFrequencyLabel(7.7), '🟢 очень частотное')
check('6.0 → очень частотное', getFrequencyLabel(6.0), '🟢 очень частотное')
check('5.5 → частотное', getFrequencyLabel(5.5), '🟢 частотное')
check('4.5 → достаточно частотное', getFrequencyLabel(4.5), '🟡 достаточно частотное')
check('3.5 → менее частотное', getFrequencyLabel(3.5), '🟠 менее частотное')
check('2.0 → редкое', getFrequencyLabel(2.0), '🔴 редкое')
check('null → вне списков', getFrequencyLabel(null), '⚪️ вне частотных списков')

console.log('\n=== Строка для сообщения ===')
check(
  'the → форматированная строка',
  formatFrequencyLine('the'),
  'Frequency: Zipf 7.7 — 🟢 очень частотное',
)
check('слово вне списков → пустая строка', formatFrequencyLine('xyzzy'), '')
check('русское слово → пустая строка', formatFrequencyLine('слово'), '')

console.log(`\n=== Итог: ${passed} passed, ${failed} failed ===\n`)
process.exit(failed > 0 ? 1 : 0)
