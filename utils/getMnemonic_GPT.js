 const openaiApiKey = process.env.OPENAI_API_KEY;

async function getMnemonic(word) {
  if (!openaiApiKey) {
    console.error("❌ OPENAI_API_KEY не найден в переменных окружения.");
    return "Mnemonic not available.";
  }

  console.log(`🔍 Запрос мнемоники для слова: "${word}"`);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Ты помощник по запоминанию английских слов с помощью мнемотехники. Когда пользователь отправляет слово, делай следующее:\n
1. Дай краткое определение этого слова на английском языке.\n
2. Дай определение этого слова на русском языке.\n
3. Придумай яркую мнемоническую ассоциацию — визуальную, необычную или эмоциональную.\n
4. Объясни эту ассоциацию на русском языке, как если бы ты объяснял ученику.\n
5. Приведи пример использования этого слова в предложении на английском.\n
6. Переведи это предложение на русский язык.\n
Если слово абстрактное или сложное, упрощай его значение с помощью аналогий или образов. Будь креативным, но полезным.`
          },
          {
            role: "user",
            content: word
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Ошибка от OpenAI API (${response.status}): ${errorText}`);
      return "Mnemonic not available.";
    }

    const data = await response.json();
    const result = data?.choices?.[0]?.message?.content;

    if (!result) {
      console.warn("⚠️ Получен пустой ответ от OpenAI.");
      return "Mnemonic not available.";
    }

    console.log("✅ Мнемоника получена успешно.");
    return result;

  } catch (err) {
    console.error("❌ Ошибка при запросе к OpenAI API:", err);
    return "Mnemonic not available.";
  }
}

module.exports = getMnemonic;