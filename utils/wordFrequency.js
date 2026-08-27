// Частотность английских слов по двум независимым рейтингам.
//
// Рейтинг 1 — COCA top-5000 lemmas (Corpus of Contemporary American English).
//   Файл: data/frequency/coca_5000_lemmas.txt (строки «lemma rank»)
//   Источник: https://github.com/brucewlee/COCA-WordFrequency (wordfrequency.info)
//   Сбалансирован по регистрам: разговорная речь, худлит, газеты, академические
//   тексты. Хранит ЛЕММЫ, поэтому «confuse» ищется напрямую, без словоформ.
//   Порядок взят из официального ранга COCA (он учитывает не только частоту, но и
//   разброс по регистрам), затем перенумерован сплошняком 1..4365 — в исходнике
//   одна лемма может занимать несколько строк с разными частями речи.
//
// Рейтинг 2 — SUBTLEX-подобный список по субтитрам (OpenSubtitles 2018, top 50k).
//   Файл: data/frequency/subtlex_50k.txt (строки «word rank»)
//   Источник: https://github.com/hermitdave/FrequencyWords (content/2018/en)
//   Частотность по речи в фильмах — лучший предиктор того, как слова реально
//   воспринимаются людьми. Хранит СЛОВОФОРМЫ и покрывает длинный хвост.
//
// Рейтинги показываются ОТДЕЛЬНО и не смешиваются: у них разные корпусы и разные
// размеры, поэтому #300 в COCA и #300 в SUBTLEX — величины разной природы.
// Слово может быть в одном списке и отсутствовать в другом — это нормально и
// само по себе информативно (напр. «login» есть только в субтитрах).
//
// Ранее использовался google-10000-english (веб-краулинг), где login=541 был
// «частотнее» hungry=8710, а инфинитивы вроде «confuse» отсутствовали как класс.

const fs = require('fs')
const getPathToFolder = require('./getPathToFolder')
const logAlerts = require('./logAlerts')

const COCA_FILE = 'data/frequency/coca_5000_lemmas.txt'
const SUBTLEX_FILE = 'data/frequency/subtlex_50k.txt'

const COCA_TOTAL = 4365
const SUBTLEX_TOTAL = 46982

// Границы шкалы в абсолютных рангах: [верхняя граница включительно, подпись].
// Шкала общая для обоих рейтингов и намеренно НЕ масштабируется под размер
// списка: «первая тысяча слов» — одинаково сильное утверждение и для COCA,
// и для субтитров, а доля от списка сделала бы #8000 из 47 000 «частотным».
const FREQUENCY_SCALE = [
  [1000, '🟢 очень частотное'],
  [3000, '🟢 частотное'],
  [5000, '🟡 достаточно частотное'],
  [10000, '🟠 менее частотное'],
  [Infinity, '🔴 редкое'],
]

// Неправильные глаголы и супплетивные формы: суффиксными правилами не выводятся,
// а без них частотные формы вроде «went» не находят свою лемму в COCA.
const IRREGULAR_FORMS = {
  am: 'be', are: 'be', is: 'be', was: 'be', were: 'be', been: 'be', being: 'be',
  bought: 'buy', brought: 'bring', built: 'build', caught: 'catch', chose: 'choose',
  came: 'come', did: 'do', does: 'do', done: 'do', drank: 'drink', drove: 'drive',
  ate: 'eat', eaten: 'eat', fell: 'fall', felt: 'feel', found: 'find', flew: 'fly',
  forgot: 'forget', gave: 'give', given: 'give', went: 'go', gone: 'go', grew: 'grow',
  had: 'have', has: 'have', heard: 'hear', held: 'hold', kept: 'keep', knew: 'know',
  known: 'know', laid: 'lay', led: 'lead', learnt: 'learn', left: 'leave', lost: 'lose',
  made: 'make', meant: 'mean', met: 'meet', paid: 'pay', put: 'put', read: 'read',
  ran: 'run', said: 'say', saw: 'see', seen: 'see', sold: 'sell', sent: 'send',
  set: 'set', shown: 'show', sang: 'sing', sat: 'sit', slept: 'sleep', spoke: 'speak',
  spoken: 'speak', spent: 'spend', stood: 'stand', taught: 'teach', told: 'tell',
  took: 'take', taken: 'take', thought: 'think', threw: 'throw', understood: 'understand',
  woke: 'wake', wore: 'wear', won: 'win', wrote: 'write', written: 'write',
  children: 'child', men: 'man', women: 'woman', feet: 'foot', teeth: 'tooth',
}
// Степени сравнения (better/best/worse) сюда намеренно НЕ входят: COCA хранит их
// как самостоятельные леммы со своими рангами, и прямое попадание точнее.

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
      const [word, rank] = line.trim().toLowerCase().split(/\s+/)
      // Первое вхождение выигрывает: оно и есть самый высокий ранг слова.
      if (word && rank && !map.has(word)) {
        map.set(word, Number(rank))
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

// Кандидаты-леммы для словоформы: «studied» → «study», «running» → «run».
// Нужны, чтобы найти слово в COCA, который хранит только базовые формы.
function toLemmaCandidates(word) {
  const out = []
  const add = (w) => {
    if (w && w.length > 1 && !out.includes(w)) out.push(w)
  }

  add(IRREGULAR_FORMS[word])

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
// Среди форм берём лучший (наименьший) ранг — частота леммы размазана по
// её формам, и самая частая форма лучше всего отражает употребимость слова.
function lookup(map, word, variants) {
  const direct = map.get(word)
  if (direct !== undefined) return direct

  let best = null
  for (const candidate of variants) {
    const rank = map.get(candidate)
    if (rank !== undefined && (best === null || rank < best)) best = rank
  }

  return best
}

// Ранг слова в каждом из рейтингов по отдельности.
// { coca: number|null, subtlex: number|null } — null означает «нет в этом списке».
function getFrequencyRanks(word) {
  const normalized = normalizeWord(word)
  if (!normalized) return { coca: null, subtlex: null }

  const lemmas = toLemmaCandidates(normalized)

  return {
    coca: lookup(getCoca(), normalized, lemmas),
    subtlex: lookup(getSubtlex(), normalized, [...lemmas, ...toFormCandidates(normalized)]),
  }
}

// Текстовая метка шкалы для ранга.
function getFrequencyLabel(rank) {
  if (rank === null || rank === undefined) return '⚪️ нет в списке'

  const level = FREQUENCY_SCALE.find(([maxRank]) => rank <= maxRank)
  return level ? level[1] : '🔴 редкое'
}

// Готовая строка для сообщения бота, либо '' — если слово не английское
// или его нет ни в одном рейтинге (тогда строку в сообщение не добавляем).
// Формат — две строки, по одной на рейтинг, чтобы номера не смешивались.
function formatFrequencyLine(word) {
  const { coca, subtlex } = getFrequencyRanks(word)
  if (coca === null && subtlex === null) return ''

  const format = (rank, total, name) => {
    if (rank === null) return `${name}: ⚪️ нет в списке`

    const formattedRank = rank.toLocaleString('en-US')
    const formattedTotal = total.toLocaleString('en-US')

    return `${name}: #${formattedRank} / ${formattedTotal} — ${getFrequencyLabel(rank)}`
  }

  return [
    format(coca, COCA_TOTAL, 'COCA (книги, пресса, речь)'),
    format(subtlex, SUBTLEX_TOTAL, 'Субтитры (разговорная речь)'),
  ].join('\n')
}

module.exports = {
  getFrequencyRanks,
  getFrequencyLabel,
  formatFrequencyLine,
  normalizeWord,
  COCA_TOTAL,
  SUBTLEX_TOTAL,
}
