let fs = require('fs')
// let dictionaryText = require('../data/dictionaryText')
const dictionaryTextFromFile = require('./dictionaryTextFromFile.js')
const dictionaryText = dictionaryTextFromFile()
 const getPathToFolder = require('./getPathToFolder')
 let path = require('path');

module.exports = function dictionaryTextToFile() {
    let nameFile = 'cache_allwords.txt'
    let pathToFolder = getPathToFolder('data/')

    
    fs.writeFile(
        // path.join(__dirname, `../${pathToFolder}${nameFile}`),
        path.join(__dirname, `../${pathToFolder}`) + `${nameFile}`,

         dictionaryText, function (err) {
        if (err) {
            return console.log(err)
        }
        console.log(`The file was saved! With name : ${nameFile}`)
        // console.log(path.join(__dirname, `../${pathToFolder}${nameFile}`))
    })
}
