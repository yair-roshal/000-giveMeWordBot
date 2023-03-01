let path = require('path')

module.exports = function getPathToFolder(folder) {
    if (process.env.NODE_ENV === 'dev') {
        console.log('dev!!!')
        console.log('__dirname', __dirname)
        console.log('`../${folder}`', `../${folder}`)
        return path.join(__dirname, `../${folder}`)
    }

    if (process.env.NODE_ENV === 'prod') {
        // docker
        // /usr/src/app

        console.log('prod!!!')
        console.log('__dirname', __dirname)
        console.log('`../${folder}`', `../${folder}`)
        return path.join(__dirname, `../${folder}`)
    }
}
