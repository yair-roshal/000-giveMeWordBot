let fs = require('fs')
let appendFile = require('fs')
const getPathToFolder = require('./getPathToFolder')
let path = require('path')

module.exports = function logAlerts(alert) {
    console.log('logAlerts :>>>>>>>>>>>>>>>>> !!!!!!!!!!!!!!!!!!')
    console.log('alert :>> ', alert)
    let nameFile = 'log-alerts.txt'
    let pathFile = getPathToFolder('data/logs/') + `${nameFile}`

    fs.appendFile(pathFile, alert + '\r\n', (err) => {
        if (!err) {
        } else {
            console.log(err)
        }
    })
}
