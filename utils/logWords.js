let fs = require('fs')
let appendFile = require('node:fs')
const getPathLogs = require('./getPathLogs')

module.exports = function logWords(wordLine) {
    let nameFileLog = 'log-words.txt'

    let path = getPathLogs()
    fs.appendFile(`${path}${nameFileLog}`, wordLine + '\r\n', (err) => {
        if (!err) {
        } else {
            console.log(err)
        }
    })
}
