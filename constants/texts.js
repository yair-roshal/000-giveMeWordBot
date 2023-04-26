let link_to_bot = '@EnglishWordsPusherBot'
let link_to_public = 'https://t.me/givemewords'

let textMessageHtml = `<b>_______________________________</b>
<b>Hello my Friend</b> 

This is a telegram bot for sending your card with translation, pronunciation, examples and link to all meanings

At the moment giveMeWord bot can :

-   send messages with the required timer,
-   the words from the dictionary are output absolutely randomly.
 
🔄 To start the showing words, use the command /start.

💬 If you have any questions or suggestions, email admin @yair770.

Our Group in Telegram : https://t.me/givemewords


🔥 Чтобы начать получать слова, нажми на старт ниже 👇🏻 или    тут   /start

<a href="${link_to_bot}">Give Me Word Bot</a> | <a href="${link_to_public}">Very Simple English</a>
 `

module.exports = { textMessageHtml }
