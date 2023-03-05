let fs = require('fs')
let appendFile = require('fs')
const getPathToFolder = require('./getPathToFolder')
const formatDate = require('./formatDate.js')
let path = require('path')

module.exports = function dictionaryTextToFile() {
    let nameFile = 'log-sessions.txt'

    const timestamp = Date.now()
    const formattedDate = formatDate(timestamp)
    let lineText = formattedDate + '\r\n'

    let pathFile = getPathToFolder('data/') + `${nameFile}`

    fs.appendFile(pathFile, lineText, (err) => {
        if (!err) {
            console.log(`log for this session added`)
        } else {
            console.log(err)
        }
    })
}
