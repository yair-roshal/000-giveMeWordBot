module.exports = function getPathToFolder(folder) {
    if (process.env.NODE_ENV === 'dev') {
        console.log(
            '`dev-----`',
            `/Users/yair/Desktop/dev/000-giveMeWordBot/${folder}/`,
        )
        return `/Users/yair/Desktop/dev/000-giveMeWordBot/${folder}/`
    }

    if (process.env.NODE_ENV === 'prod') {
        console.log('`prod-----`', `${folder}`)
        return `${folder}`
        // return '../data/logs/'
    }
}
