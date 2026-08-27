// Частотность английских слов по двум взаимодополняющим корпусам.
//
// Слой 1 — COCA top-5000 lemmas (Corpus of Contemporary American English).
//   Файл: data/frequency/coca_5000_lemmas.txt (строки «lemma zipf»)
//   Источник: https://github.com/brucewlee/COCA-WordFrequency (wordfrequency.info)
//   Сбалансирован по регистрам: разговорная речь, худлит, газеты, академические
//   тексты. Хранит ЛЕММЫ, поэтому «confuse» ищется напрямую, без словоформ.
//
// Слой 2 — SUBTLEX-подобный список по субтитрам (OpenSubtitles 2018, top 50k).
//   Файл: data/frequency/subtlex_50k.txt (строки «word zipf»)
//   Источник: https://github.com/hermitdave/FrequencyWords (content/2018/en)
//   Частотность по речи в фильмах — лучший предиктор того, как слова реально
//   воспринимаются людьми. Хранит СЛОВОФОРМЫ и покрывает длинный хвост.
//
// Почему два, а не один: COCA даёт «учебную» шкалу для ядра языка, но обрывается
// на 5000 лемм; SUBTLEX добирает всё, что за этой границей. Ранее использовался
// google-10000-english (веб-краулинг), где login=541 был «частотнее» hungry=8710,
// а инфинитивы вроде «confuse» отсутствовали как класс — обе проблемы отсюда.
//
// Шкала наружу — Zipf, а не голый ранг: Zipf = log10(частота на миллиард слов),
// то есть 7 — служебное слово вроде «the», 4 — обычное разговорное, ниже 3 —
// редкое книжное. Значения посчитаны из реальных частот корпусов заранее и лежат
// в файлах вторым полем, поэтому шкалы двух списков сопоставимы между собой.

const fs = require('fs')
const getPathToFolder = require('./getPathToFolder')
const logAlerts = require('./logAlerts')

const COCA_FILE = 'data/frequency/coca_5000_lemmas.txt'
const SUBTLEX_FILE = 'data/frequency/subtlex_50k.txt'

// Границы Zipf-шкалы: [нижняя граница включительно, подпись].
// Zipf ≈ 6+ — служебные слова, 5..6 — ядро речи, ниже 3 — редкое книжное.
const ZIPF_SCALE = [
  [6.0, '🟢 очень частотное'],
  [5.0, '🟢 частотное'],
  [4.0, '🟡 достаточно частотное'],
  [3.0, '🟠 менее частотное'],
  [0.0, '🔴 редкое'],
]

// Ниже этого Zipf слово из SUBTLEX считаем шумом субтитров, а не лексикой.
const MIN_ZIPF = 1.5

let cocaMap = null
let subtlexMap = null

// Приводим слово к ключу списка: регистр и внешняя пунктуация не должны
// мешать поиску («Extent», «EXTENT», «extent.» — одно и то же слово).
function normalizeWord(word) {
  if (typeof word !== 'string') return ''
  return word
    .trim()
    .toLowerCase()
    .replace(/^[^a-z']+|[^a-z']+$/g, '')
}

function loadList(file) {
  const map = new Map()

  try {
    const data = fs.readFileSync(getPathToFolder(file), 'utf8')

    data.split('\n').forEach((line) => {
      const [word, zipf] = line.trim().toLowerCase().split(/\s+/)
      // Первое вхождение выигрывает: оно и есть самая высокая частота слова.
      if (word && zipf && !map.has(word)) {
        map.set(word, Number(zipf))
      }
    })
  } catch (err) {
    console.error(`Error reading frequency file ${file}:`, err)
    logAlerts(err)
  }

  return map
}

function getCoca() {
  return cocaMap || (cocaMap = loadList(COCA_FILE))
}

function getSubtlex() {
  return subtlexMap || (subtlexMap = loadList(SUBTLEX_FILE))
}

// Кандидаты-леммы для словоформы: «studied» → «studi», «study», «studie»…
// Нужны, чтобы найти слово в COCA, который хранит только базовые формы.
function toLemmaCandidates(word) {
  const out = []
  const add = (w) => {
    if (w && w.length > 1 && !out.includes(w)) out.push(w)
  }

  if (word.endsWith('ies') && word.length > 4) add(word.slice(0, -3) + 'y')
  if (word.endsWith('es') && word.length > 3) add(word.slice(0, -2))
  if (word.endsWith('s') && !word.endsWith('ss')) add(word.slice(0, -1))
  if (word.endsWith('ied') && word.length > 4) add(word.slice(0, -3) + 'y')
  if (word.endsWith('ed') && word.length > 3) {
    add(word.slice(0, -2))
    add(word.slice(0, -1))
  }
  if (word.endsWith('ing') && word.length > 4) {
    add(word.slice(0, -3))
    add(word.slice(0, -3) + 'e')
  }
  if (word.endsWith('ly') && word.length > 4) add(word.slice(0, -2))
  // Удвоенная согласная перед окончанием: «running» → «run», «stopped» → «stop».
  const doubled = word.match(/^(.*?)([bdfglmnprt])\2(ed|ing)$/)
  if (doubled) add(doubled[1] + doubled[2])

  return out
}

// Словоформы для леммы — обратная задача: SUBTLEX хранит формы, и «skew»
// находится только через «skewed».
function toFormCandidates(word) {
  const out = [word + 's', word + 'ed', word + 'ing', word + 'es']

  if (word.endsWith('e')) {
    out.push(word.slice(0, -1) + 'ing')
    out.push(word + 'd')
  }
  if (word.endsWith('y')) out.push(word.slice(0, -1) + 'ies')

  return out
}

// Ищем слово в одной карте: сначала как есть, потом через словоформы.
// Среди форм берём максимум — частота леммы «размазана» по её формам,
// и самая частая форма лучше всего отражает употребимость слова.
function lookup(map, word, variants) {
  const direct = map.get(word)
  if (direct !== undefined) return direct

  let best = null
  for (const candidate of variants) {
    const zipf = map.get(candidate)
    if (zipf !== undefined && (best === null || zipf > best)) best = zipf
  }

  return best
}

// Основной результат: { zipf, source } либо null, если слова нет нигде.
// COCA имеет приоритет — это сбалансированный по регистрам корпус;
// SUBTLEX добирает всё, что не вошло в его 5000 лемм.
function getFrequencyInfo(word) {
  const normalized = normalizeWord(word)
  if (!normalized) return null

  const cocaZipf = lookup(getCoca(), normalized, toLemmaCandidates(normalized))
  if (cocaZipf !== null) {
    return { zipf: Math.round(cocaZipf * 10) / 10, source: 'COCA' }
  }

  const subZipf = lookup(getSubtlex(), normalized, [
    ...toLemmaCandidates(normalized),
    ...toFormCandidates(normalized),
  ])
  if (subZipf !== null && subZipf >= MIN_ZIPF) {
    return { zipf: Math.round(subZipf * 10) / 10, source: 'SUBTLEX' }
  }

  return null
}

// Zipf-балл слова либо null — если слова нет ни в одном списке.
function getFrequencyZipf(word) {
  const info = getFrequencyInfo(word)
  return info ? info.zipf : null
}

// Текстовая метка шкалы для Zipf-балла.
function getFrequencyLabel(zipf) {
  if (zipf === null || zipf === undefined) return '⚪️ вне частотных списков'

  const level = ZIPF_SCALE.find(([minZipf]) => zipf >= minZipf)
  return level ? level[1] : '🔴 редкое'
}

// Готовая строка для сообщения бота, либо '' — если слово не английское
// или его нет в списках (тогда строку в сообщение не добавляем).
function formatFrequencyLine(word) {
  const info = getFrequencyInfo(word)
  if (!info) return ''

  return `Frequency: Zipf ${info.zipf.toFixed(1)} — ${getFrequencyLabel(info.zipf)}`
}

module.exports = {
  getFrequencyInfo,
  getFrequencyZipf,
  getFrequencyLabel,
  formatFrequencyLine,
  normalizeWord,
}
