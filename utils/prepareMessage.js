const getTokenJWT = require('./getTokenJWT')
const changeTokenToIAM = require('./changeTokenToIAM')

const translateText = require('./translateText')

const logWords = require('../utils/logWords')
const formatDate = require('./formatDate.js')
const checkTokenExpiration = require('./checkTokenExpiration.js')

const dotenv = require('dotenv')
dotenv.config()

module.exports = async function prepareMessage(
    response,
    randomIndex,
    wordLineDictionary,
    isOneWord,
    firstWord,
    dictionaryLength,
    isEnglishLanguage,
    leftWords,
) {
    const timestamp = Date.now()
    const formattedDate = formatDate(timestamp)

    console.log(
        'timestamp, formattedDate :>> ',
        timestamp,
        ' - ',
        formattedDate,
    )

    let logMessage =
        `${randomIndex + 1}.${wordLineDictionary}  -  ` + formattedDate
    logWords(logMessage)

    let responseData
    if (response != undefined && isOneWord) {
        responseData = response.data

        const tokenJWT = await getTokenJWT()
        // console.log('tokenJWT :>> ', tokenJWT)

        const tokenIAM = await changeTokenToIAM({
            jwt: tokenJWT,
        })
        console.log('tokenIAM :>> ', tokenIAM)

        let examples = ''
        for (const key0 in responseData[0].meanings) {
            for (const key in responseData[0].meanings[key0].definitions) {
                if (
                    responseData[0].meanings[key0].definitions[key].example !=
                    undefined
                ) {
                    examples +=
                        '\r\n' +
                        `- ${responseData[0].meanings[key0].definitions[key].example}`

                    // await checkTokenExpiration(token)
                    //     .then(( ) => {
                    //         console.log(
                    //             '==token good========== res===',
                    //             res,
                    //         )
                    //     })
                    //     .catch((err) =>
                    //         console.log('==checkTokenExpiration() : ', err),
                    //     )

                    await translateText(
                        responseData[0].meanings[key0].definitions[key].example,
                        tokenIAM,
                    )
                        .then((translateTextVar) => {
                            // console.log('translateTextVar222', translateTextVar)
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
        for (const key in responseData[0].phonetics) {
            if (responseData[0].phonetics[key].text != undefined) {
                phonetic = responseData[0].phonetics[key].text
            }
        }

        let audio

        for (const key in responseData[0].phonetics) {
            if (responseData[0].phonetics[key].audio != undefined) {
                audio = responseData[0].phonetics[key].audio
            }
        }

        if (!audio) {
            audio = `https://translate.google.com.vn/translate_tts?ie=UTF-8&q=${firstWord}&tl=en&client=tw-ob`
        }

        let phoneticLine = phonetic //pronunciation
            ? `${phonetic} - `
            : responseData[0] && responseData[0].phonetic
            ? `${responseData[0] && responseData[0].phonetic} - `
            : ''
        phoneticLine = isOneWord ? phoneticLine : ''

        let exampleLine = examples && isOneWord ? `${examples}` : ''

        let audioLine =
            audio && isOneWord && responseData[0]
                ? `${audio}`
                : responseData[0].phonetics[1] &&
                  responseData[0].phonetics[1].audio
                ? `${
                      responseData[0].phonetics[1] &&
                      responseData[0].phonetics[1].audio
                  }`
                : ''

        const linkToTranslate = `https://context.reverso.net/%D0%BF%D0%B5%D1%80%D0%B5%D0%B2%D0%BE%D0%B4/%D0%B0%D0%BD%D0%B3%D0%BB%D0%B8%D0%B9%D1%81%D0%BA%D0%B8%D0%B9-%D1%80%D1%83%D1%81%D1%81%D0%BA%D0%B8%D0%B9/${firstWord}`

        return `<b>_______________________________</b>
<b>${phoneticLine}${wordLineDictionary} </b>
${exampleLine}
<b>${randomIndex + 1}/(${dictionaryLength}) </b>
<a href="${audioLine}">   </a>
<a href="${linkToTranslate}">Translate with Context</a>
`
    } else {
        const linkToTranslate = `https://translate.google.com/?hl=${
            isEnglishLanguage ? 'en' : 'ru'
        }&sl=auto&tl=ru&text=${leftWords}&op=translate
        `

        return `<b>_______________________________</b>
<b>${wordLineDictionary} </b>

<a href="${linkToTranslate}">Translate with Google</a>

<b>${randomIndex + 1}/(${dictionaryLength})  </b>
`
    }
}
