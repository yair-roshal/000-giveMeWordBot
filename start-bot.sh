#!/bin/bash

# start-bot.sh - Безопасный запуск бота

echo "🤖 Запуск Give Me Word Bot..."

# Проверяем есть ли уже запущенные экземпляры
if pm2 list | grep -q "give_me_word_bot.*online"; then
    echo "⚠️  Бот уже запущен в PM2. Останавливаю старый экземпляр..."
    pm2 stop give_me_word_bot
    pm2 delete give_me_word_bot
fi

# Проверяем есть ли процессы node с server.js
if pgrep -f "node.*server.js" > /dev/null; then
    echo "⚠️  Найдены запущенные Node.js процессы. Останавливаю их..."
    pkill -f "node.*server.js"
fi

# Удаляем PID файл если он существует
if [ -f "./bot.pid" ]; then
    echo "🧹 Удаляю старый PID файл..."
    rm ./bot.pid
fi

# Запускаем бота
echo "🚀 Запускаю бота..."
pm2 start ecosystem.config.js --env dev

echo "✅ Бот запущен! Проверьте статус: pm2 status"
echo "📝 Логи: pm2 logs give_me_word_bot"
