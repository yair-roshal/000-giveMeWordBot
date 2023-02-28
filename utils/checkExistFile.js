const fs = require('fs')

module.exports = function checkExistFile(filePath) {
    const fileContent = ''

    fs.writeFile(filePath, fileContent, { flag: 'wx' }, function (err) {
        if (!err) {
            console.log('New empty File was created .')
        } else {
            console.log('Error555: file already exists')
            // console.log('Error555: file already exists', err)
        }
    })

    // // fs.constants.F_OK = check if a file exists
    // fs.access(filePath, fs.constants.F_OK, (err) => {
    //     if (err) {
    //         console.log('File does not exist')
    //         // create if only file doesn't exist
    //         fs.writeFile(filePath, fileContent, { flag: 'wx' }, function (err) {
    //             if (err) {
    //                 console.log('Error:', err)
    //             } else {
    //                 console.log('File is created or updated.')
    //             }
    //         })
    //     } else {
    //         console.log('File exists')
    //     }
    // })
}
