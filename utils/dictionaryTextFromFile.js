let fs = require('fs')
const getPathToFolder = require('./getPathToFolder')
// const checkExistFile = require('./checkExistFile')
const logAlerts = require('./logAlerts')
// const { dictionaries } = require('../constants/constants')
const getNamesDictionaries = require('../utils/getNamesDictionaries')

module.exports = function dictionaryTextFromFile() {
    let allData = ''
    let dictionaries = getNamesDictionaries()

    dictionaries.forEach((fileName) => {
        let pathFile = getPathToFolder('data/dictionaries/') + `${fileName}`
        // let pathFile = getPathToFolder('data/') + `${fileName}`
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
    // console.log('allData333 :>> ', allData)
    return allData
}
