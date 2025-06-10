let fs = require('fs')
const getPathToFolder = require('./getPathToFolder')
// const checkExistFile = require('./checkExistFile')
const logAlerts = require('./logAlerts')
// const { dictionaries } = require('../constants/constants')
const getNamesDictionaries = require('./getNamesDictionaries')

module.exports = function getAllWordsFromFiles() {
    let dictionaryText = ''
    let dictionaries = getNamesDictionaries()
    let objAllDictRows = {}
    
    if (!dictionaries || dictionaries.length === 0) {
        console.error('No dictionary files found')
        return { dictionaryText: '', objAllDictRows: {} }
    }

    dictionaries.forEach((fileName) => {
        let pathFile = getPathToFolder('data/dictionaries/') + `${fileName}`

        try {
            const data = fs.readFileSync(pathFile, 'utf8')
            if (!data || data.trim() === '') {
                console.error(`Empty dictionary file: ${fileName}`)
                return
            }

            const rowAmount = data.split('\n').length
            objAllDictRows[fileName] = rowAmount
            dictionaryText = dictionaryText + data
        } catch (err) {
            console.error(`Error reading dictionary file ${fileName}:`, err)
            logAlerts(err)
        }
    })

    if (!dictionaryText || dictionaryText.trim() === '') {
        console.error('No valid dictionary content found')
        return { dictionaryText: '', objAllDictRows: {} }
    }

    return { dictionaryText, objAllDictRows }
}
