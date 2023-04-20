const fs = require('fs')

const getNamesDictionaries = () => {
    fs.readdir('/path/to/folder', (err, files) => {
        if (err) {
            console.error(err)
            return
        }
        console.log(files)
        return files
    })
}
console.log('files :>> ', files)


module.exports = getNamesDictionaries
