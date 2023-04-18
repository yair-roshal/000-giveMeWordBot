let fs = require('fs')
const getPathToFolder = require('./getPathToFolder')
// const checkExistFile = require('./checkExistFile')
const logAlerts = require('./logAlerts')

module.exports = function dictionaryTextFromFile() {
    let nameFile = 'allWords.txt'
    let nameFile2 = 'dic2_phrase_verb.txt'

    let files = [nameFile, nameFile2]
    let allData = ''

    files.forEach((fileName) => {
        let pathFile = getPathToFolder('data/') + `${fileName}`
        // console.log('pathFile4444', pathFile)
        //  checkExistFile(pathFile)

        try {
            const data = fs.readFileSync(pathFile, 'utf8')
            allData = allData + data
            // return data
        } catch (err) {
            logAlerts(err)

            console.error(
                `err_readFileSync in  :    ${pathFile}`,
                // err,
            )
        }
    })
    console.log('allData333 :>> ', allData)
    return allData
}
