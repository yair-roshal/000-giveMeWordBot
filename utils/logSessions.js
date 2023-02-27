let fs = require('fs')
let appendFile = require('node:fs')
const getPathLogs = require('./getPathLogs')

module.exports = function dictionaryTextToFile() {
    let nameFileLog = 'log-sessions.txt'
    let lineText = Date(Date.now()).toString() + '\r\n'
    let path = getPathLogs()

    fs.appendFile(`${path}${nameFileLog}`, lineText, (err) => {
        if (!err) {
            console.log(`log for this session added`)
        } else {
            console.log(err)
        }
    })
}
