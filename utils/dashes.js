// Единый источник правды для всех дефисо/тире-подобных символов.
// Покрывает класс Unicode Pd (Punctuation, dash) + минус-подобные знаки,
// которые встречаются в текстах из веба, Word, PDF и CJK-источников.
//
//   U+002D HYPHEN-MINUS            -
//   U+2010 HYPHEN                  ‐
//   U+2011 NON-BREAKING HYPHEN     ‑
//   U+2012 FIGURE DASH             ‒
//   U+2013 EN DASH                 –
//   U+2014 EM DASH                 —
//   U+2015 HORIZONTAL BAR          ―
//   U+2043 HYPHEN BULLET           ⁃
//   U+2212 MINUS SIGN              −
//   U+FE58 SMALL EM DASH           ﹘
//   U+FE63 SMALL HYPHEN-MINUS      ﹣
//   U+FF0D FULLWIDTH HYPHEN-MINUS  －
const DASH_CLASS = '\\u002D\\u2010-\\u2015\\u2043\\u2212\\uFE58\\uFE63\\uFF0D'

// Проверка: содержит ли строка хотя бы один дефис/тире.
const DASH_REGEX = new RegExp(`[${DASH_CLASS}]`)

// Разделитель слова и перевода: дефис/тире, окружённый пробелом хотя бы
// с одной стороны. Это отличает настоящий разделитель (« — », «word - перевод»)
// от дефиса внутри слова («well-being»), который окружён буквами без пробелов.
const DASH_SEPARATOR_REGEX = new RegExp(`\\s[${DASH_CLASS}]|[${DASH_CLASS}]\\s`)

// Разбивает строку «слово <разделитель> перевод» по первому разделителю,
// окружённому пробелом. Возвращает { left, right } или null, если разделителя нет.
function splitByDash(line) {
  if (!line) return null
  const match = DASH_SEPARATOR_REGEX.exec(line)
  if (!match) return null
  // Позиция самого символа дефиса внутри совпадения (учитываем ведущий пробел).
  const dashIndex = /\s/.test(line[match.index]) ? match.index + 1 : match.index
  return {
    left: line.slice(0, dashIndex).trim(),
    right: line.slice(dashIndex + 1).trim(),
  }
}

module.exports = { DASH_REGEX, DASH_SEPARATOR_REGEX, splitByDash }
