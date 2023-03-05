const translateText = require('./translateText')
const getIamToken = require('./getIamToken')
const logWords = require('../utils/logWords')
const formatDate = require('./formatDate.js')

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

    return getIamTokenNow().then(async function (token) {
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
                    console.log(
                        'text_for_translate',
                        response[0].meanings[key0].definitions[key].example,
                    )
                    await translateText(
                        response[0].meanings[key0].definitions[key].example,
                        token,
                    )
                        .then((translateTextVar) => {
                            console.log('translateTextVar222', translateTextVar)
                            if (translateTextVar)
                                examples +=
                                    '\r\n' + '-' + translateTextVar + '\r\n'
                        })
                        .catch((err) =>
                            console.log('err_translateText() : ', err),
                        )
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

        let phoneticLine = phonetic //pronunciation
            ? `${phonetic} - `
            : response[0] && response[0].phonetic
            ? `${response[0] && response[0].phonetic} - `
            : ''
        phoneticLine = isOneWord ? phoneticLine : ''

        let exampleLine = examples && isOneWord ? `${examples}` : ''

        let audioLine =
            audio && isOneWord && response[0]
                ? `${audio}`
                : response[0].phonetics[1] && response[0].phonetics[1].audio
                ? `${
                      response[0].phonetics[1] && response[0].phonetics[1].audio
                  }`
                : ''

        linkToTranslate = `https://context.reverso.net/%D0%BF%D0%B5%D1%80%D0%B5%D0%B2%D0%BE%D0%B4/%D0%B0%D0%BD%D0%B3%D0%BB%D0%B8%D0%B9%D1%81%D0%BA%D0%B8%D0%B9-%D1%80%D1%83%D1%81%D1%81%D0%BA%D0%B8%D0%B9/${firstEnglishWord}`

        const timestamp = Date.now()
        const formattedDate = formatDate(timestamp)

        let logMessage = `${randomIndex + 1}.${word}  -  ` + formattedDate
        console.log(logMessage)
        logWords(logMessage)

        return (
            `<b>__________________</b>
 <b>${randomIndex + 1}/(${dictionaryLength}).  ${phoneticLine}${word} </b>` +
            '\r\n' +
            '\r\n' +
            `
${exampleLine}
<a href="${audioLine}">.</a>
<a href="${linkToTranslate}">See on Context</a>
<b>__________________</b>`
        )
    })
}

{
    /* <a href="${linkToTranslate}">See on Context</a> */
}
