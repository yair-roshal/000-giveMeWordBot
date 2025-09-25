#!/bin/bash

# stop-bot.sh - Безопасная остановка бота

echo "🛑 Остановка Give Me Word Bot..."

# Останавливаем PM2 процесс
if pm2 list | grep -q "give_me_word_bot"; then
    echo "⏹️  Останавливаю PM2 процесс..."
    pm2 stop give_me_word_bot
    pm2 delete give_me_word_bot
    echo "✅ PM2 процесс остановлен"
fi

# Останавливаем любые оставшиеся Node.js процессы
if pgrep -f "node.*server.js" > /dev/null; then
    echo "⏹️  Останавливаю Node.js процессы..."
    pkill -f "node.*server.js"
    echo "✅ Node.js процессы остановлены"
fi

# Удаляем PID файл
if [ -f "./bot.pid" ]; then
    echo "🧹 Удаляю PID файл..."
    rm ./bot.pid
fi

echo "✅ Бот полностью остановлен!"
