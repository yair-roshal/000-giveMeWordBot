const fs = require('fs')
const path = require('path')

const openaiApiKey = process.env.OPENAI_API_KEY
const cacheFilePath = path.join(__dirname, 'mnemonicsCache.json')

// Загружаем кэш
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
  return /[\u0590-\u05FF]/.test(word)
}

// Промпт для английских слов
const englishPrompt = `
Ты создаёшь карточку для запоминания английского слова или выражения в стиле русских мнемонических словарей (Михаил Голденков и подобные) с расширенным учебным блоком.

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
— английское слово или его перевод стоит рядом
— есть лёгкий юмор, абсурд или бытовая сценка
— тон разговорный, чуть хулиганский, без пошлости

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
(1–3 коротких предложения)
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

async function getMnemonic(word, rightWords = []) {
  if (!openaiApiKey) {
    console.error('❌ OPENAI_API_KEY не найден в переменных окружения.')
    return 'Mnemonic not available.'
  }

  // Проверка кэша
  if (cache[word]) {
    console.log(`♻️ Возвращаю кэш для слова: "${word}"`)
    return cache[word]
  }

  const isHebrew = isHebrewWord(word)
  const systemPrompt = isHebrew ? hebrewPrompt : englishPrompt

  console.log(`🔍 Запрос мнемоники для слова: "${word}" (${isHebrew ? 'иврит' : 'английский'})`)

  // Формируем уточняющее сообщение для перевода
  const clarification =
    rightWords.length > 0 ? `Сфокусируйся на следующих значениях слова "${word}": ${rightWords}.` : ''

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1200,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `${word}\n\n${clarification}`.trim(),
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Ошибка от OpenAI API (${response.status}): ${errorText}`)
      return 'Mnemonic not available.'
    }
    

    const data = await response.json()
    const result = data?.choices?.[0]?.message?.content
    
    if (!result) {
      console.warn('⚠️ Пустой ответ от OpenAI.')
      return 'Mnemonic not available!'
    }

    
    console.log('✅ Мнемоника получена. Сохраняю в кэш.')

    // Сохраняем в кэш
    cache[word] = result
    console.log('cache_length', Object.keys(cache).length)
    fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2), 'utf-8')

    return result
  } catch (err) {
    console.error('❌ Ошибка при запросе к OpenAI API:', err)
    return 'Mnemonic not available.'
  }
}

module.exports = getMnemonic
