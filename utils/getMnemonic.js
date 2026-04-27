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
Ты создаёшь карточку для запоминания английского слова или выражения.
Форматируй ответ строго под Telegram HTML: жирный — <b>текст</b>, курсив — <i>текст</i>.
Каждый блок отделяй пустой строкой. Не используй заголовки # и ##. Не используй символы ** и *.

Структура ответа:

📌 <b>АНГЛИЙСКОЕ СЛОВО ИЛИ ВЫРАЖЕНИЕ (ВСЕГДА КАПСОМ И ЖИРНЫМ)</b> — русский эквивалент
Уровень сложности на следующей строке:
A1 🟢 | A2 🟡 | B1 🔵 | B2 🟣 | C1 🟠 | C2 🔴
(выдели жирным подходящий вариант тегом <b>...</b>)

🔊 Транскрипция: [ˈtrænskrɪpʃən]
🗣 Русское приближённое чтение: трэнскрипшн

📊 <b>Частотность:</b> прогресс-бар из 10 квадратов (например ▓▓▓░░░░░░░) и цифра (3/10)

📝 <b>Стиль:</b> 👔 Formal | 💬 Informal | 📚 Neutral
(выдели жирным подходящий вариант тегом <b>...</b>)

🕰 <b>Актуальность:</b> 🏺 Obsolete | ⚠️ Limited Use | ✅ Current
(выдели жирным подходящий вариант тегом <b>...</b>)

- • • • • • • • • • • • • • • • • • •

🧠 <b>Ассоциация (мнемоника):</b>
Яркая, смешная, запоминающаяся ассоциация, созвучная с произношением.
Опиши живую сцену в 1–2 предложениях.

- • • • • • • • • • • • • • • • • • •

💬 <b>Словосочетания:</b>
Три умеренно сложных и часто употребляемых в речи словосочетания (<i>курсивом</i>),
где само слово или выражение всегда <b>жирное</b>.
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

🌱 <b>Семейство слов:</b>
Просто перечисли родственные слова через запятую (без пояснений).

- • • • • • • • • • • • • • • • • • •

🔍 <b>Происхождение (этимология):</b>
Кратко объясни: от какого слова произошло, почему используется именно в таком значении.
(1–2 коротких предложения)
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
