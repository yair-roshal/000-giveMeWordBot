let fs = require('fs')
// let dictionaryText = require('../data/dictionaryText')
const dictionaryTextFromFile = require('./dictionaryTextFromFile.js')
const dictionaryText = dictionaryTextFromFile()
 const getPathToFolder = require('./getPathToFolder')

module.exports = function dictionaryTextToFile() {
    let nameFile = 'cache_allWords.txt'
    let path = getPathToFolder('data/')

    
    fs.writeFile(path.join(__dirname, `../${path}${nameFile}`), dictionaryText, function (err) {
        if (err) {
            return console.log(err)
        }
        console.log(`The file was saved! With name : ${nameFile}`)
        // console.log(path.join(__dirname, `../${path}${nameFile}`))
    })
}
