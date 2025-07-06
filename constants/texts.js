let link_to_bot = 'https://t.me/EnglishWordsPusherBot'
let link_to_public = 'https://t.me/givemewords'

let textMessageHtml = `<b>Hello my Friend</b> 

This is a telegram bot for sending your card with translation, pronunciation, examples and link to all meanings

At the moment giveMeWord bot can :

-   send messages with the required timer,
-   the words from the dictionary are output absolutely randomly,
-   customize the interval for receiving words (1 minute to 4 hours) — via the ⚙️ button in the main menu below.
 
Link to this Bot : <a href="${link_to_bot}">Give Me Word Bot</a> 

Our Group in Telegram : <a href="${link_to_public}">Very Simple English</a>

💬 If you have any questions or suggestions, email admin @yair770.

🔥 To start getting words, click on start below 👇🏻 or here /start

⚙️ Use /interval or the ⚙️ button to check/change your interval settings

 `

module.exports = { textMessageHtml }
