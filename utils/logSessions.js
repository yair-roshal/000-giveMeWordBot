let fs = require('fs')
let appendFile = require('node:fs')
const getPathToFolder = require('./getPathToFolder')
const formatDate = require('./formatDate.js')

module.exports = function dictionaryTextToFile() {
    let nameFile = 'log-sessions.txt'

    const timestamp = Date.now()
    const formattedDate = formatDate(timestamp)
    let lineText = formattedDate + '\r\n'

    let path = getPathToFolder('data/logs/')
    console.log('path_dictionaryTextToFile : ', path)

    fs.appendFile(`${path}${nameFile}`, lineText, (err) => {
        if (!err) {
            console.log(`log for this session added`)
        } else {
            console.log(err)
        }
    })
}
