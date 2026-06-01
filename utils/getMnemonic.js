const fs = require('fs')
const path = require('path')
const { mnemonicFallbacks } = require('../constants/texts.js')

const openaiApiKey = process.env.OPENAI_API_KEY
const cacheFilePath = path.join(__dirname, 'mnemonicsCache.json')

// Модель OpenAI для генерации мнемоник. Меняй здесь одним местом.
const OPENAI_MODEL = 'gpt-4o'

// ───────────────────────── Настройки устойчивости ─────────────────────────
// Жёстко прописаны в коде — подкрути числа здесь, если понадобится.
const MAX_ATTEMPTS = 3 // всего попыток
const BASE_BACKOFF_MS = 500
const MAX_BACKOFF_MS = 4000
const COOLDOWN_MS = 15 * 60 * 1000 // 15 минут
const REQUEST_TIMEOUT_MS = 30000

// Категории ошибок
const ERROR_TYPE = {
  NONE: 'none',
  QUOTA: 'insufficient_quota',
  RATE_LIMIT: 'rate_limit',
  AUTH: 'auth',
  BAD_REQUEST: 'bad_request',
  SERVER: 'server_error',
  NETWORK: 'network',
  EMPTY: 'empty_response',
  UNKNOWN: 'unknown',
}

// Какие категории имеет смысл повторять
const RETRYABLE = new Set([
  ERROR_TYPE.RATE_LIMIT,
  ERROR_TYPE.SERVER,
  ERROR_TYPE.NETWORK,
])

// ───────────────────────── Состояние circuit breaker ─────────────────────────
const serviceState = {
  cooldownUntil: 0, // timestamp окончания cooldown (0 — нет)
  lastErrorType: ERROR_TYPE.NONE,
  lastErrorAt: 0,
  lastSuccessAt: 0,
}

function isInCooldown() {
  return Date.now() < serviceState.cooldownUntil
}

function startCooldown(reason) {
  const wasActive = isInCooldown()
  serviceState.cooldownUntil = Date.now() + COOLDOWN_MS
  if (!wasActive) {
    console.warn(
      `🧊 Mnemonic cooldown START: reason=${reason}, до ${new Date(
        serviceState.cooldownUntil,
      ).toISOString()} (${Math.round(COOLDOWN_MS / 1000)}s)`,
    )
  }
}

// Состояние сервиса для health-check / админ-команды
function getMnemonicServiceState() {
  const inCooldown = isInCooldown()
  return {
    status: inCooldown ? 'cooldown' : 'normal',
    inCooldown,
    cooldownUntil: serviceState.cooldownUntil || null,
    cooldownRemainingMs: inCooldown
      ? serviceState.cooldownUntil - Date.now()
      : 0,
    lastErrorType: serviceState.lastErrorType,
    lastErrorAt: serviceState.lastErrorAt || null,
    lastSuccessAt: serviceState.lastSuccessAt || null,
  }
}

// ───────────────────────── Кэш ─────────────────────────
let cache = {}
if (fs.existsSync(cacheFilePath)) {
  try {
    cache = JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'))
  } catch (err) {
    console.warn('⚠️ Не удалось прочитать кэш:', err)
  }
}

// Проверяет, содержит ли слово ивритские символы
function isHebrewWord(word) {
  return /[֐-׿]/.test(word)
}

// Промпт для английских слов
const englishPrompt = `
Ты создаёшь карточку для запоминания английского слова или выражения в стиле русских мнемонических Чудо словарей Самвела Гарибяна. Английский без английского.

ВХОД: английское слово или выражение: {WORD}

Форматируй ответ строго под Telegram HTML: жирный — <b>текст</b>, курсив — <i>текст</i>.
Каждый блок отделяй пустой строкой. Не используй заголовки # и ##. Не используй символы ** и *.

📖 <b>{WORD}</b> [транскрипция кириллицей] — перевод

- • • • • • • • • • • • • • • • • • •

🔊 <b>Звуковая ассоциация:</b>
<b>{русское слово или фраза, созвучные английскому}</b>
— созвучие должно опираться на ТРАНСКРИПЦИЮ, а не на написание.
— допустимы частичные совпадения по ударному слогу или корню.
— можно «растягивать» русское слово через дефисы, чтобы подчеркнуть совпадение: (Дезе-р-т-иров), (би-ки-н-и).

💡 <b>Фраза-зацепка:</b>
Одно короткое предложение (8–15 слов), где:
— русское созвучие в скобках или <b>жирным</b>
— английское слово или его перевод или созвучие стоит рядом
— есть юмор, абсурд или бытовая сценка

🎬 <b>Картинка-образ:</b>
1–2 предложения с яркой нелепой визуальной сценой, которую легко мысленно «увидеть».

Если приличного созвучия нет — честно скажи и предложи мнемонику другого типа (через корень, ложного друга или чисто визуальную ассоциацию).

- • • • • • • • • • • • • • • • • • •

💬 <b>Словосочетания:</b>
Три умеренно сложных и часто употребляемых в речи словосочетания (<i>курсивом</i>), где само слово или выражение всегда <b>жирное</b>.
Перед каждым словосочетанием ставь 2 подходящих эмодзи.
Каждое с переводом на русский на следующей строке.

👉 Сразу после каждого словосочетания приводи пример предложения с этим словосочетанием.
— В предложении слово или выражение должно быть <b>жирным</b>.

- • • • • • • • • • • • • • • • • • •

❓ <b>Три вопросительных предложения</b> (прошедшее, настоящее, будущее):
Каждое с переводом на русский на следующей строке.
Само слово или выражение в предложении — <b>жирным</b>.

1️⃣ ⬇️ Past: ...
   — перевод
2️⃣ ➡️ Present: ...
   — перевод
3️⃣ ⬆️ Future: ...
   — перевод

- • • • • • • • • • • • • • • • • • •

🔍 <b>Происхождение (этимология):</b>
(3-5  предложения)

- • • • • • • • • • • • • • • • • • •

🔁 <b>Синонимы:</b>
5–10 синонимов английского слова или выражения, через запятую.
Каждый синоним — <b>жирным</b>, после него в скобках краткий перевод на русский.
Если у слова есть разные значения — сгруппируй синонимы по значениям.
`.trim();

// Промпт для ивритских слов
const hebrewPrompt = `
Ты создаешь мнемонику для ивритского слова для русскоязычного ученика. Сделай следующее:
1. Ивритское слово, транслитерация (латиницей и кириллицей), ударение
2. Перевод на русский
3. Корень слова (שורש) если есть, и родственные слова
4. Ассоциация — яркая, смешная, запоминающаяся, созвучная с ивритским произношением (используй созвучие с русскими словами!)
5. Три примера предложений на иврите с переводом (разные времена/формы если применимо)
6. Мини-викторина: выбор, пропуск, правда/ложь + ответы

Будь лёгким, дружелюбным, не академичным. Помоги запомнить слово навсегда!
`.trim()

// ───────────────────────── Утилиты ─────────────────────────
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Возвращает локализованный fallback по категории ошибки
function fallbackFor(errorType) {
  switch (errorType) {
    case ERROR_TYPE.QUOTA:
      return mnemonicFallbacks.quota
    case ERROR_TYPE.RATE_LIMIT:
    case ERROR_TYPE.SERVER:
    case ERROR_TYPE.NETWORK:
      return mnemonicFallbacks.temporary
    default:
      return mnemonicFallbacks.generic
  }
}

// Классифицирует HTTP-ответ с ошибкой OpenAI
function classifyHttpError(status, bodyText) {
  let code = ''
  let apiType = ''
  try {
    const parsed = JSON.parse(bodyText)
    code = parsed?.error?.code || ''
    apiType = parsed?.error?.type || ''
  } catch (_) {
    // не JSON — оставляем пустыми
  }

  if (status === 429) {
    // OpenAI помечает исчерпание квоты code/type = insufficient_quota
    if (code === 'insufficient_quota' || apiType === 'insufficient_quota') {
      return ERROR_TYPE.QUOTA
    }
    return ERROR_TYPE.RATE_LIMIT
  }
  if (status === 401 || status === 403) return ERROR_TYPE.AUTH
  if (status === 400) return ERROR_TYPE.BAD_REQUEST
  if (status >= 500) return ERROR_TYPE.SERVER
  return ERROR_TYPE.UNKNOWN
}

// Парсит заголовок Retry-After (секунды или HTTP-дата) -> мс
function parseRetryAfter(headerValue) {
  if (!headerValue) return null
  const asNumber = Number(headerValue)
  if (!Number.isNaN(asNumber)) return asNumber * 1000
  const asDate = Date.parse(headerValue)
  if (!Number.isNaN(asDate)) {
    const diff = asDate - Date.now()
    return diff > 0 ? diff : 0
  }
  return null
}

// Экспоненциальный backoff с джиттером, с учётом cap
function backoffDelay(attempt) {
  const exp = Math.min(BASE_BACKOFF_MS * 2 ** (attempt - 1), MAX_BACKOFF_MS)
  const jitter = Math.random() * (BASE_BACKOFF_MS / 2)
  return Math.min(exp + jitter, MAX_BACKOFF_MS)
}

// Один сетевой вызов. Возвращает { ok, content, errorType, status, retryAfterMs, details }
async function callOpenAI(systemPrompt, userContent) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_tokens: 1200,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const bodyText = await response.text()
      const errorType = classifyHttpError(response.status, bodyText)
      const retryAfterMs = parseRetryAfter(response.headers.get('retry-after'))
      return {
        ok: false,
        errorType,
        status: response.status,
        retryAfterMs,
        details: bodyText.slice(0, 300), // обрезаем, секретов в теле ошибки нет
      }
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) {
      return { ok: false, errorType: ERROR_TYPE.EMPTY, status: response.status }
    }
    return { ok: true, content }
  } catch (err) {
    // AbortError (таймаут) или сетевые сбои (DNS/connect/ECONNRESET)
    return {
      ok: false,
      errorType: ERROR_TYPE.NETWORK,
      details: err?.name === 'AbortError' ? 'request_timeout' : err?.message,
    }
  } finally {
    clearTimeout(timeout)
  }
}

// ───────────────────────── Основная функция ─────────────────────────
// Сохраняет прежний контракт: всегда возвращает строку (готовая мнемоника
// или локализованный fallback). Никогда не бросает — доставка слова не должна ломаться.
async function getMnemonic(word, rightWords = []) {
  if (!openaiApiKey) {
    console.error('❌ OPENAI_API_KEY не найден в переменных окружения.')
    return mnemonicFallbacks.generic
  }

  // Кэш — даже во время cooldown отдаём готовое
  if (cache[word]) {
    console.log(`♻️ Возвращаю кэш для слова: "${word}"`)
    return cache[word]
  }

  // Circuit breaker: во время cooldown не дёргаем API
  if (isInCooldown()) {
    const remainingS = Math.round(
      (serviceState.cooldownUntil - Date.now()) / 1000,
    )
    console.warn(
      `🧊 Mnemonic в cooldown (ещё ~${remainingS}s), пропускаю вызов API для "${word}".`,
    )
    return fallbackFor(serviceState.lastErrorType)
  }

  const isHebrew = isHebrewWord(word)
  const systemPrompt = isHebrew ? hebrewPrompt : englishPrompt
  console.log(
    `🔍 Запрос мнемоники для слова: "${word}" (${isHebrew ? 'иврит' : 'английский'})`,
  )

  const clarification =
    rightWords.length > 0
      ? `Сфокусируйся на следующих значениях слова "${word}": ${rightWords}.`
      : ''
  const userContent = `${word}\n\n${clarification}`.trim()

  let lastErrorType = ERROR_TYPE.UNKNOWN

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await callOpenAI(systemPrompt, userContent)

    if (res.ok) {
      console.log(
        `✅ Мнемоника получена (попытка ${attempt}/${MAX_ATTEMPTS}). Сохраняю в кэш.`,
      )
      serviceState.lastSuccessAt = Date.now()
      serviceState.lastErrorType = ERROR_TYPE.NONE
      cache[word] = res.content
      console.log('cache_length', Object.keys(cache).length)
      try {
        fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2), 'utf-8')
      } catch (err) {
        console.warn('⚠️ Не удалось записать кэш:', err?.message)
      }
      return res.content
    }

    lastErrorType = res.errorType
    serviceState.lastErrorType = res.errorType
    serviceState.lastErrorAt = Date.now()

    console.error(
      `❌ Mnemonic API fail: type=${res.errorType} status=${
        res.status ?? 'n/a'
      } attempt=${attempt}/${MAX_ATTEMPTS}${
        res.details ? ` details="${res.details}"` : ''
      }`,
    )

    // Исчерпана квота — ретраи бессмысленны, включаем cooldown и выходим
    if (res.errorType === ERROR_TYPE.QUOTA) {
      startCooldown(ERROR_TYPE.QUOTA)
      return fallbackFor(ERROR_TYPE.QUOTA)
    }

    // Не повторяемые ошибки — выходим сразу
    if (!RETRYABLE.has(res.errorType)) {
      return fallbackFor(res.errorType)
    }

    // Повторяемая ошибка: если попытки ещё есть — ждём и пробуем снова
    if (attempt < MAX_ATTEMPTS) {
      const delay =
        res.retryAfterMs != null && res.retryAfterMs >= 0
          ? Math.min(res.retryAfterMs, MAX_BACKOFF_MS)
          : backoffDelay(attempt)
      console.warn(
        `⏳ Повтор через ${Math.round(delay)}ms (type=${res.errorType}, ` +
          `attempt=${attempt + 1}/${MAX_ATTEMPTS}${
            res.retryAfterMs != null ? ', по Retry-After' : ''
          })`,
      )
      await sleep(delay)
    }
  }

  console.error(
    `❌ Mnemonic: исчерпаны попытки (${MAX_ATTEMPTS}), последняя ошибка type=${lastErrorType}.`,
  )
  return fallbackFor(lastErrorType)
}

module.exports = getMnemonic
// Состояние сервиса для админ-команды /mnemonic_status
module.exports.getMnemonicServiceState = getMnemonicServiceState
