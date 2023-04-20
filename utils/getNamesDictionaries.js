const fs = require('fs')
const getPathToFolder = require('./getPathToFolder')
const { dictionaries } = require('../constants/constants')

module.exports = getNamesDictionaries = () => {
    let dic

    const pathToFolder = getPathToFolder('data/dictionaries/')
    console.log('pathToFolder :>> ', pathToFolder)
    fs.readdir(pathToFolder, (err, files) => {
        console.log('files :>> ', files)
        if (err) console.log(err)
        else {
            // console.log('\nCurrent directory filenames:')
            // files.forEach((file) => {
            //     console.log(file)
            // })
            return files
            // dic = files
        }
    })
    console.log('dictionaries :>> ', dictionaries)
    return dictionaries
    // return dic
}
