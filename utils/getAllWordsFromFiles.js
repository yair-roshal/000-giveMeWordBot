let fs = require('fs')
const getPathToFolder = require('./getPathToFolder')
// const checkExistFile = require('./checkExistFile')
const logAlerts = require('./logAlerts')
// const { dictionaries } = require('../constants/constants')
const getNamesDictionaries = require('./getNamesDictionaries')

module.exports = function getAllWordsFromFiles() {
    let allData = ''
    let dictionaries = getNamesDictionaries()
    let objAllDictRows = {}
    console.log('dictionaries :>> ', dictionaries)

    dictionaries.forEach((fileName) => {
        let pathFile = getPathToFolder('data/dictionaries/') + `${fileName}`

        try {
            const data = fs.readFileSync(pathFile, 'utf8')

            const rowAmount = data.split('\n').length

            objAllDictRows[fileName] = rowAmount

            // allDataArray = allDataArray.push({ data, rowAmount })
            allData = allData + data
        } catch (err) {
            logAlerts(err)

            console.error(
                `err_readFileSync in  :    ${pathFile}`,
                // err,
            )
        }
    })
    console.log('objAllDictRows :>> ', objAllDictRows)
    return allData
}
