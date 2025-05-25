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

async function getMnemonic(word, rightWords = []) {
  if (!openaiApiKey) {
    console.error('❌ OPENAI_API_KEY не найден в переменных окружения.')
    return 'Mnemonic not available.'
  }

  // Уникальный ключ с учетом переводов
  const cacheKey = `${word}::${rightWords.join(',')}`

  // Проверка кэша
  if (cache[cacheKey]) {
    console.log(`♻️ Возвращаю кэш для слова: "${word}" с переводами: [${rightWords.join(', ')}]`)
    return cache[cacheKey]
  }

  console.log(`🔍 Запрос мнемоники для слова: "${word}" с переводами: [${rightWords.join(', ')}]`)

  // Формируем уточняющее сообщение для перевода
  const clarification =
    rightWords.length > 0 ? `Сфокусируйся на следующих значениях слова "${word}": ${rightWords.join(', ')}.` : ''

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        max_tokens: 700,
        messages: [
          {
            role: 'system',
            content: `
Ты создаешь мнемонику для английского слова. Сделай следующее:
1. Английское слово, транскрипция, русское приближённое чтение
2. Перевод
3. Ассоциация — яркая, смешная, запоминающаяся
4. Несколько похожих слов для образа
5. 2–3 значения с примерами на английском и переводом
6. Три вопросительных предложения (прошедшее, настоящее, будущее)
7. Мини-викторина: выбор, пропуск, правда/ложь + ответы

Будь лёгким, дружелюбным, не академичным. Помоги запомнить слово навсегда!
          `.trim(),
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
      return 'Mnemonic not available.'
    }

    console.log('✅ Мнемоника получена. Сохраняю в кэш.')

    // Сохраняем в кэш
    cache[cacheKey] = result
    console.log('cache.length', cache.length)
    fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2), 'utf-8')

    return result
  } catch (err) {
    console.error('❌ Ошибка при запросе к OpenAI API:', err)
    return 'Mnemonic not available.'
  }
}

module.exports = getMnemonic
