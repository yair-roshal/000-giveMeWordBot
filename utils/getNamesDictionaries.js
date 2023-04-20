const fs = require('fs')
const getPathToFolder = require('./getPathToFolder')
const { dictionaries } = require('../constants/constants')

module.exports = getNamesDictionaries = () => {
    // let dic

    const pathToFolder = getPathToFolder('data/dictionaries/')
    console.log('pathToFolder :>> ', pathToFolder)
    return fs.readdirSync(pathToFolder, (err, files) => {
        console.log('files :>> ', files)
        if (err) console.log(err)
        else {
            // console.log('\nCurrent directory filenames:')
            // files.forEach((file) => {
            // console.log(file)
            // })
            console.log(files)

            return files
            // dic = files
        }
    })
    // console.log('dictionaries :>> ', dictionaries)
    // console.log('files :>> ', files)
    // // return dictionaries
    // return files
    // return dic
}
