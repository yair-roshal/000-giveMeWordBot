// let fs = require('fs')
// let appendFile = require('fs')
// const getPathToFolder = require('./getPathToFolder')
// let path = require('path')

// module.exports = function logAlerts(alert) {
//     console.log('logAlerts :>>>>>>>>>>>>>>>>> !!!!!!!!!!!!!!!!!!')
//     console.log('alert :>> ', alert)
//     let nameFile = 'log-alerts.txt'
//     let pathFile = getPathToFolder('data/logs/') + `${nameFile}`

//     fs.appendFile(pathFile, alert + '\r\n', (err) => {
//         if (!err) {
//         } else {
//             console.log(err)
//         }
//     })
// }


const fs = require('fs');
const path = require('path');
const getPathToFolder = require('./getPathToFolder');

module.exports = function logAlerts(alert) {
    console.log('logAlerts :>>>>>>>>>>>>>>>>> !!!!!!!!!!!!!!!!!!');
    console.log('alert :>> ', alert);
    const nameFile = 'log-alerts.txt';
    const folderPath = getPathToFolder('data/logs/');
    const pathFile = path.join(folderPath, nameFile);

    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    fs.appendFile(pathFile, alert + '\r\n', (err) => {
        if (err) {
            console.log(err);
        }
    });
};
