const anthropicApiKey = process.env.ANTHROPIC_API_KEY

async function getMnemonic(word) {
  if (!anthropicApiKey) {
    console.error('❌ ANTHROPIC_API_KEY не найден в переменных окружения.')
    return 'Mnemonic not available.'
  }

  console.log(`🔍 Запрос мнемоники для слова: "${word}" через Claude`)

  const systemPrompt = `
Ты — дружелюбный помощник по запоминанию английских слов с помощью ассоциативной мнемотехники. Твоя цель — сделать так, чтобы пользователь легко и надолго запомнил каждое слово. Когда пользователь отправляет слово, делай следующее:

1. Укажи английское слово, его американскую транскрипцию (в скобках) и добавь пример чтения русскими буквами (в скобках, приблизительно).
2. Дай краткое, простое определение на английском языке.
3. Приведи перевод на русский язык.
4. Придумай яркую, необычную, запоминающуюся ассоциацию (мнемонику). Она может быть абсурдной, смешной, визуальной, рифмованной или эмоциональной. Основывай ассоциацию на звучании и/или значении слова.
   - Можно использовать ритмичную фразу или рифму, если это помогает.
   - Можно представить слово в виде сцены, персонажа или образа, как в методе Айвазовского или Цицерона.
5. Объясни ассоциацию по-русски, как другу: просто, с юмором и визуальными деталями. Сделай так, чтобы образ «вспыхнул» в воображении.
6. Укажи 2–3 значения слова на русском языке. Для каждого значения приведи:
   - Пример использования на английском (курсивом),
   - Перевод примера на русский язык (в скобках).

Форматируй ответ структурно: делай заголовки, списки и абзацы для удобства чтения.

Будь дружелюбным, лёгким и понятным. Никакой сухой академичности. Помоги пользователю не просто узнать, а запомнить слово — навсегда.
`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: word,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Ошибка от Claude API (${response.status}): ${errorText}`)
      return 'Mnemonic not available.'
    }

    const data = await response.json()
    const result = data?.content?.[0]?.text

    if (!result) {
      console.warn('⚠️ Получен пустой ответ от Claude.')
      return 'Mnemonic not available.'
    }

    console.log('✅ Мнемоника от Claude получена успешно.')
    console.log('result', result)
    return result
  } catch (err) {
    console.error('❌ Ошибка при запросе к Claude API:', err)
    return 'Mnemonic not available.'
  }
}

module.exports = getMnemonic
