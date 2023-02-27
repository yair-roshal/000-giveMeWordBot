let fs = require('fs')

module.exports = function dictionaryTextFromFile(nameFile) {
    nameFile = 'allwords.txt'
    try {
        const data = fs.readFileSync(
            `/Users/yair/Desktop/dev/000-telegram-bot-english-words/data/${nameFile}`,
            'utf8',
        )
        console.log(data)
        return data
    } catch (err) {
        console.error(err)
    }
}
