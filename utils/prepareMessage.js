const translateText = require('./translateText')
const getIamToken = require('./getIamToken')
const logWords = require('../utils/logWords')

let token

module.exports = async function prepareMessage(
    response,
    randomIndex,
    word,
    isOneWord,
    firstEnglishWord,
    dictionaryLength,
) {
    let getIamTokenNow = function () {
        return getIamToken().then((res) => {
            return res
        })
    }

    return getIamTokenNow().then(async function (result) {
        token = result

        let examples = ''
        for (const key0 in response[0].meanings) {
            for (const key in response[0].meanings[key0].definitions) {
                if (
                    response[0].meanings[key0].definitions[key].example !=
                    undefined
                ) {
                    examples +=
                        '\r\n' +
                        `- ${response[0].meanings[key0].definitions[key].example}`

                    let translateTextVar
                    await translateText(
                        response[0].meanings[key0].definitions[key].example,
                        token,
                    ).then((res) => {
                        translateTextVar = res
                        console.log('translateTextVar222', translateTextVar)
                        examples += '\r\n' + '-' + translateTextVar + '\r\n'
                    })
                }
            }
        }

        let phonetic = ''
        for (const key in response[0].phonetics) {
            if (response[0].phonetics[key].text != undefined) {
                phonetic = response[0].phonetics[key].text
            }
        }

        let audio

        for (const key in response[0].phonetics) {
            if (response[0].phonetics[key].audio != undefined) {
                audio = response[0].phonetics[key].audio
            }
        }

        if (!audio) {
            audio = `https://translate.google.com.vn/translate_tts?ie=UTF-8&q=${firstEnglishWord}&tl=en&client=tw-ob`
        }

        let phoneticLine = phonetic
            ? `${phonetic} - `
            : response[0]?.phonetic
            ? `${response[0]?.phonetic} - `
            : ''
        phoneticLine = isOneWord ? phoneticLine : ''

        let exampleLine = examples && isOneWord ? `${examples}` : ''

        let audioLine =
            audio && isOneWord
                ? `${audio}`
                : response[0]?.phonetics[1]?.audio
                ? `${response[0]?.phonetics[1]?.audio}`
                : ''

        date = new Date()

        let message = `${randomIndex + 1}.${word}  -  ` + date.toString()
        console.log(message)
        logWords(message)

        return (
            `<b>__________________</b>
 <b>${randomIndex + 1}/(${dictionaryLength}).  ${phoneticLine}${word} </b>` +
            '\r\n' +
            '\r\n' +
            `
${exampleLine}
<a href="${audioLine}">.</a>
<b>__________________</b>`
        )
    })
}
