'use strict'

class YamlParseException {
  constructor(message, parsedLine, snippet, parsedFile) {
    this.rawMessage = message
    this.parsedLine = parsedLine !== undefined ? parsedLine : -1
    this.snippet = snippet !== undefined ? snippet : null
    this.parsedFile = parsedFile !== undefined ? parsedFile : null
    this.message = message
  }

  setParsedLine(parsedLine) {
    this.parsedLine = parsedLine
  }

  setSnippet(snippet) {
    this.snippet = snippet
  }
}
class YamlInline {
  parse(value) {
    var result = null
    value = this.trim(value)

    if (0 == value.length) {
      return ''
    }

    switch (value.charAt(0)) {
    case '[':
      result = this.parseSequence(value)
      break
    case '{':
      result = this.parseMapping(value)
      break
    default:
      result = this.parseScalar(value)
    }

    // some comment can end the scalar
    if (value.substr(this.i + 1).replace(/^\s*#.*$/, '') != '') {
      throw new YamlParseException(
        `Unexpected characters near ${value.substr(this.i)}.`
      )
    }

    return result
  }

  parseScalar(scalar, delimiters, stringDelimiters, i, evaluate) {
    if (delimiters == undefined) delimiters = null
    if (stringDelimiters == undefined) stringDelimiters = ['"', '\'']
    if (i == undefined) i = 0
    if (evaluate == undefined) evaluate = true

    var output = null
    var pos = null
    var matches = null

    if (this.inArray(scalar[i], stringDelimiters)) {
      // quoted scalar
      output = this.parseQuotedScalar(scalar, i)
      i = this.i
      if (null !== delimiters) {
        var tmp = scalar.substr(i).replace(/^\s+/, '')
        if (!this.inArray(tmp.charAt(0), delimiters)) {
          throw new YamlParseException(
            `Unexpected characters (${scalar.substr(i)}).`
          )
        }
      }
    } else {
      // "normal" string
      if (delimiters) {
        matches = new RegExp('^(.+?)(' + delimiters.join('|') + ')').exec(
          (scalar + '').substring(i)
        )
      }
      if (!delimiters) {
        output = (scalar + '').substring(i)

        i += output.length

        // remove comments
        pos = output.indexOf(' #')
        if (pos != -1) {
          output = output.substr(0, pos).replace(/\s+$/g, '')
        }
      } else if (matches) {
        output = matches[1]
        i += output.length
      } else {
        throw new YamlParseException(
          `Malformed inline YAML string (${scalar}).`
        )
      }

      // unended inline string
      var end = output.slice(-1)
      if (end === '}' || end === ']') {
        throw new YamlParseException(
          `Malformed inline YAML string (${scalar}).`
        )
      }
      output = evaluate ? this.evaluateScalar(output) : output
    }

    this.i = i

    return output
  }

  parseQuotedScalar(scalar, i) {
    var matches = null
    //var item = /^(.*?)['"]\s*(?:[,:]|[}\]]\s*,)/.exec((scalar+'').substring(i))[1];

    if (
      !(matches = new RegExp('^' + YamlInline.REGEX_QUOTED_STRING).exec(
        (scalar + '').substring(i)
      ))
    ) {
      throw new YamlParseException(
        `Malformed inline YAML string (${(scalar + '').substring(i)}).`
      )
    }

    var output = matches[0].substr(1, matches[0].length - 2)

    var unescaper = new YamlUnescaper()

    if ('"' == (scalar + '').charAt(i)) {
      output = unescaper.unescapeDoubleQuotedString(output)
    } else {
      output = unescaper.unescapeSingleQuotedString(output)
    }

    i += matches[0].length

    this.i = i
    return output
  }

  parseSequence(sequence, i) {
    if (i == undefined) i = 0

    var output = []
    var len = sequence.length
    i += 1

    // [foo, bar, ...]
    while (i < len) {
      switch (sequence.charAt(i)) {
      case '[':
        // nested sequence
        output.push(this.parseSequence(sequence, i))
        i = this.i
        break
      case '{':
        // nested mapping
        output.push(this.parseMapping(sequence, i))
        i = this.i
        break
      case ']':
        this.i = i
        return output
      case ',':
      case ' ':
        break
      default:
        var isQuoted = this.inArray(sequence.charAt(i), ['"', '\''])
        var value = this.parseScalar(sequence, [',', ']'], ['"', '\''], i)
        i = this.i

        if (!isQuoted && (value + '').indexOf(': ') != -1) {
          // embedded mapping?
          try {
            value = this.parseMapping('{' + value + '}')
          } catch (e) {
            if (!(e instanceof YamlParseException)) throw e
            // no, it's not
          }
        }

        output.push(value)

        i--
      }

      i++
    }

    throw new YamlParseException(`Malformed inline YAML string "${sequence}"`)
  }

  parseMapping(mapping, i) {
    if (i == undefined) i = 0
    var output = {}
    var len = mapping.length
    i += 1
    var done = false
    var doContinue = false

    // {foo: bar, bar:foo, ...}
    while (i < len) {
      doContinue = false

      switch (mapping.charAt(i)) {
      case ' ':
      case ',':
        i++
        doContinue = true
        break
      case '}':
        this.i = i
        return output
      }

      if (doContinue) continue

      // key
      var key = this.parseScalar(mapping, [':', ' '], ['"', '\''], i, false)
      i = this.i

      // value
      done = false
      while (i < len) {
        switch (mapping.charAt(i)) {
        case '[':
          // nested sequence
          output[key] = this.parseSequence(mapping, i)
          i = this.i
          done = true
          break
        case '{':
          // nested mapping
          output[key] = {
            $v: this.parseMapping(mapping, i)
          }
          i = this.i
          done = true
          break
        case ':':
        case ' ':
          break
        default:
          output[key] = this.parseScalar(mapping, [',', '}'], ['"', '\''], i)
          i = this.i
          done = true
          i--
        }

        ++i

        if (done) {
          doContinue = true
          break
        }
      }

      if (doContinue) continue
    }

    throw new YamlParseException(`('Malformed inline YAML string "${mapping}"`)
  }

  evaluateScalar(scalar) {
    scalar = this.trim(scalar)

    var raw = null
    var cast = null

    if ('null' == scalar.toLowerCase() || '' == scalar || '~' == scalar)
      return null
    if ((scalar + '').indexOf('!str ') == 0) return ('' + scalar).substring(5)
    if ((scalar + '').indexOf('! ') == 0)
      return parseInt(this.parseScalar((scalar + '').substr(2)), 10)
    if (/^\d+$/.test(scalar)) {
      raw = scalar
      cast = parseInt(scalar, 10)
      return '0' == scalar.charAt(0)
        ? this.octdec(scalar)
        : '' + raw == '' + cast ? cast : raw
    }
    if ('true' == (scalar + '').toLowerCase()) return true
    if ('false' == (scalar + '').toLowerCase()) return false
    if (this.isNumeric(scalar)) {
      return '0x' === (scalar + '').substr(0, 2) ? this.hexdec(scalar) : scalar
    }
    if (scalar.toLowerCase() == '.inf') return Infinity
    if (scalar.toLowerCase() == '.nan') return NaN
    if (scalar.toLowerCase() == '-.inf') return -Infinity
    if (/^(-|\+)?[0-9,]+(\.[0-9]+)?$/.test(scalar))
      return parseFloat(scalar.split(',').join(''))
    if (this.getTimestampRegex().test(scalar))
      return new Date(this.strtotime(scalar))
    //else
    return '' + scalar
  }

  getTimestampRegex() {
    return new RegExp(
      '^' +
        '([0-9][0-9][0-9][0-9])' +
        '-([0-9][0-9]?)' +
        '-([0-9][0-9]?)' +
        '(?:(?:[Tt]|[ \t]+)' +
        '([0-9][0-9]?)' +
        ':([0-9][0-9])' +
        ':([0-9][0-9])' +
        '(?:.([0-9]*))?' +
        '(?:[ \t]*(Z|([-+])([0-9][0-9]?)' +
        '(?::([0-9][0-9]))?))?)?' +
        '$',
      'gi'
    )
  }

  trim(str) {
    return (str + '').replace(/^\s+/, '').replace(/\s+$/, '')
  }

  isNumeric(input) {
    return (
      input - 0 == input && input.length > 0 && input.replace(/\s+/g, '') != ''
    )
  }

  inArray(key, tab) {
    var i
    var len = tab.length
    for (i = 0; i < len; i++) {
      if (key == tab[i]) return true
    }
    return false
  }

  getKeys(tab) {
    var ret = []

    for (var name in tab) {
      if (tab.hasOwnProperty(name)) {
        ret.push(name)
      }
    }

    return ret
  }

  octdec(input) {
    return parseInt((input + '').replace(/[^0-7]/gi, ''), 8)
  }

  hexdec(input) {
    input = this.trim(input)
    if ((input + '').substr(0, 2) == '0x') input = (input + '').substring(2)
    return parseInt((input + '').replace(/[^a-f0-9]/gi, ''), 16)
  }

  strtotime(h, b) {
    var f,
        c,
        g,
        k,
        d = ''
    h = (h + '').replace(/\s{2,}|^\s|\s$/g, ' ').replace(/[\t\r\n]/g, '')
    if (h === 'now') {
      return b === null || isNaN(b) ? new Date().getTime() || 0 : b || 0
    } else {
      if (!isNaN((d = Date.parse(h)))) {
        return d || 0
      } else {
        if (b) {
          b = new Date(b)
        } else {
          b = new Date()
        }
      }
    }
    h = h.toLowerCase()
    var e = {
      day: {
        sun: 0,
        mon: 1,
        tue: 2,
        wed: 3,
        thu: 4,
        fri: 5,
        sat: 6
      },
      mon: [
        'jan',
        'feb',
        'mar',
        'apr',
        'may',
        'jun',
        'jul',
        'aug',
        'sep',
        'oct',
        'nov',
        'dec'
      ]
    }
    var a = function(i) {
      var o = i[2] && i[2] === 'ago'
      var n = (n = i[0] === 'last' ? -1 : 1) * (o ? -1 : 1)
      switch (i[0]) {
      case 'last':
      case 'next':
        switch (i[1].substring(0, 3)) {
        case 'yea':
          b.setFullYear(b.getFullYear() + n)
          break
        case 'wee':
          b.setDate(b.getDate() + n * 7)
          break
        case 'day':
          b.setDate(b.getDate() + n)
          break
        case 'hou':
          b.setHours(b.getHours() + n)
          break
        case 'min':
          b.setMinutes(b.getMinutes() + n)
          break
        case 'sec':
          b.setSeconds(b.getSeconds() + n)
          break
        default:
          if (i[0] === 'mon' && i[1] === 'month') {
            b.setMonth(b.getMonth() + n)
          } else {
            var l = e.day[i[1].substring(0, 3)]
            if (typeof l !== 'undefined') {
              var p = l - b.getDay()
              if (p === 0) {
                p = 7 * n
              } else {
                if (p > 0) {
                  if (i[0] === 'last') {
                    p -= 7
                  }
                } else {
                  if (i[0] === 'next') {
                    p += 7
                  }
                }
              }
              b.setDate(b.getDate() + p)
              b.setHours(0, 0, 0, 0)
            }
          }
        }
        break
      default:
        if (/\d+/.test(i[0])) {
          n *= parseInt(i[0], 10)
          switch (i[1].substring(0, 3)) {
          case 'yea':
            b.setFullYear(b.getFullYear() + n)
            break
          case 'mon':
            b.setMonth(b.getMonth() + n)
            break
          case 'wee':
            b.setDate(b.getDate() + n * 7)
            break
          case 'day':
            b.setDate(b.getDate() + n)
            break
          case 'hou':
            b.setHours(b.getHours() + n)
            break
          case 'min':
            b.setMinutes(b.getMinutes() + n)
            break
          case 'sec':
            b.setSeconds(b.getSeconds() + n)
            break
          }
        } else {
          return false
        }
        break
      }
      return true
    }
    g = h.match(
      /^(\d{2,4}-\d{2}-\d{2})(?:\s(\d{1,2}:\d{2}(:\d{2})?)?(?:\.(\d+))?)?$/
    )
    if (g !== null) {
      if (!g[2]) {
        g[2] = '00:00:00'
      } else {
        if (!g[3]) {
          g[2] += ':00'
        }
      }
      k = g[1].split(/-/g)
      k[1] = e.mon[k[1] - 1] || k[1]
      k[0] = +k[0]
      k[0] =
        k[0] >= 0 && k[0] <= 69
          ? '20' + (k[0] < 10 ? '0' + k[0] : k[0] + '')
          : k[0] >= 70 && k[0] <= 99 ? '19' + k[0] : k[0] + ''
      return parseInt(
        this.strtotime(k[2] + ' ' + k[1] + ' ' + k[0] + ' ' + g[2]) +
          (g[4] ? g[4] : ''),
        10
      )
    }
    var j =
      '([+-]?\\d+\\s(years?|months?|weeks?|days?|hours?|min|minutes?|sec|seconds?|sun\\.?|sunday|mon\\.?|monday|tue\\.?|tuesday|wed\\.?|wednesday|thu\\.?|thursday|fri\\.?|friday|sat\\.?|saturday)|(last|next)\\s(years?|months?|weeks?|days?|hours?|min|minutes?|sec|seconds?|sun\\.?|sunday|mon\\.?|monday|tue\\.?|tuesday|wed\\.?|wednesday|thu\\.?|thursday|fri\\.?|friday|sat\\.?|saturday))(\\sago)?'
    g = h.match(new RegExp(j, 'gi'))
    if (g === null) {
      return false
    }
    for (f = 0, c = g.length; f < c; f++) {
      if (!a(g[f].split(' '))) {
        return false
      }
    }
    return b.getTime() || 0
  }
}
YamlInline.REGEX_QUOTED_STRING =
  '(?:"(?:[^"\\\\]*(?:\\\\.[^"\\\\]*)*)"|\'(?:[^\']*(?:\'\'[^\']*)*)\')'

class YamlUnescaper {
  unescapeSingleQuotedString(value) {
    return value.replace(/''/g, '\'')
  }

  unescapeDoubleQuotedString(value) {
    var callback = function(m) {
      return new YamlUnescaper().unescapeCharacter(m)
    }

    // evaluate the string
    return value.replace(
      new RegExp(YamlUnescaper.REGEX_ESCAPED_CHARACTER, 'g'),
      callback
    )
  }

  unescapeCharacter(value) {
    switch (value.charAt(1)) {
    case '0':
      return String.fromCharCode(0)
    case 'a':
      return String.fromCharCode(7)
    case 'b':
      return String.fromCharCode(8)
    case 't':
      return '\t'
    case '\t':
      return '\t'
    case 'n':
      return '\n'
    case 'v':
      return String.fromCharCode(11)
    case 'f':
      return String.fromCharCode(12)
    case 'r':
      return String.fromCharCode(13)
    case 'e':
      return '\x1b'
    case ' ':
      return ' '
    case '"':
      return '"'
    case '/':
      return '/'
    case '\\':
      return '\\'
    case 'N':
      // U+0085 NEXT LINE
      return '\x00\x85'
    case '_':
      // U+00A0 NO-BREAK SPACE
      return '\x00\xA0'
    case 'L':
      // U+2028 LINE SEPARATOR
      return ' ('
    case 'P':
      // U+2029 PARAGRAPH SEPARATOR
      return ' )'
    case 'x':
      return this.pack('n', new YamlInline().hexdec(value.substr(2, 2)))
    case 'u':
      return this.pack('n', new YamlInline().hexdec(value.substr(2, 4)))
    case 'U':
      return this.pack('N', new YamlInline().hexdec(value.substr(2, 8)))
    }
  }

  pack(B) {
    var g = 0,
        o = 1,
        m = '',
        z = 0,
        E,
        s
    while (g < B.length) {
      E = B.charAt(g)
      s = ''
      g++
      while (g < B.length && B.charAt(g).match(/[\d*]/) !== null) {
        s += B.charAt(g)
        g++
      }
      if (s === '') {
        s = '1'
      }
      switch (E) {
      case 'n':
        if (s === '*') {
          s = arguments.length - o
        }
        if (s > arguments.length - o) {
          throw new Error(
            'Warning:  pack() Type ' + E + ': too few arguments'
          )
        }
        for (z = 0; z < s; z++) {
          m += String.fromCharCode((arguments[o] >> 8) & 255)
          m += String.fromCharCode(arguments[o] & 255)
          o++
        }
        break
      case 'N':
        if (s === '*') {
          s = arguments.length - o
        }
        if (s > arguments.length - o) {
          throw new Error(
            'Warning:  pack() Type ' + E + ': too few arguments'
          )
        }
        for (z = 0; z < s; z++) {
          m += String.fromCharCode((arguments[o] >> 24) & 255)
          m += String.fromCharCode((arguments[o] >> 16) & 255)
          m += String.fromCharCode((arguments[o] >> 8) & 255)
          m += String.fromCharCode(arguments[o] & 255)
          o++
        }
        break
      default:
        throw new Error(
          'Warning:  pack() Type ' + E + ': unknown format code'
        )
      }
    }
    if (o < arguments.length) {
      throw new Error(
        'Warning: pack(): ' + (arguments.length - o) + ' arguments unused'
      )
    }
    return m
  }
}

YamlUnescaper.REGEX_ESCAPED_CHARACTER =
  '\\\\([0abt\tnvfre "\\/\\\\N_LP]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8})'

class YamlParser {
  constructor(offset, lined) {
    this.lines = []
    this.currentLineNb = -1
    this.currentLine = ''
    this.refs = {}
    this.offset = offset !== undefined ? offset : 0
    this.lined = lined
  }

  parse(value, row) {
    this.currentLineNb = -1
    this.currentLine = ''
    this.lines = this.cleanup(value).split('\n')
    if (!this.lined) {
      var offset = (row || 0) + this.offset // add this.offset in case leading comments are removed by cleanup
      for (var i = 0; i < this.lines.length; i++) {
        this.lines[i] += ' #' + (i + offset)
      }
      this.lined = true
    }

    var data = null
    var context = null

    while (this.moveToNextLine()) {
      if (this.isCurrentLineEmpty()) {
        continue
      }

      // tab?
      if (this.currentLine.charAt(0) == '\t') {
        throw new YamlParseException(
          'A YAML file cannot contain tabs as indentation.',
          this.getRealCurrentLineNb() + 1,
          this.currentLine
        )
      }

      var isRef = false
      var isInPlace = false
      var isProcessed = false
      var values = null
      var matches = null
      var c = null
      var parser = null
      var block = null
      var key = null
      var parsed = null
      var len = null
      var reverse = null

      let isSequence = false
      let isMapping = false
      values = /^-((\s+)(.+?))?\s*$/.exec(this.currentLine)
      isSequence = !!values
      if (!isSequence) {
        values = new RegExp(
          '^(' +
            YamlInline.REGEX_QUOTED_STRING +
            '|[^ \'"[{].*?) *:(\\s+(.+?))?\\s*$'
        ).exec(this.currentLine)
        isMapping = !!values
      }
      if (isSequence) {
        if (context && 'mapping' === context) {
          throw new YamlParseException(
            'You cannot define a sequence item when in a mapping',
            this.getRealCurrentLineNb() + 1,
            this.currentLine
          )
        }
        context = 'sequence'

        if (!this.isDefined(data)) data = []

        values = {
          leadspaces: values[2],
          value: values[3]
        }

        if (
          this.isDefined(values.value) &&
          (matches = /^&([^ ]+) *(.*)/.exec(values.value))
        ) {
          matches = {
            ref: matches[1],
            value: matches[2]
          }
          isRef = matches.ref
          values.value = matches.value
        }

        // array
        if (
          !this.isDefined(values.value) ||
          '' == this.trim(values.value) ||
          values.value.replace(/^ +/, '').charAt(0) == '#'
        ) {
          c = this.getRealCurrentLineNb() + 1
          parser = new YamlParser(c, this.lined)
          parser.refs = this.refs
          data.push(
            this.getRealCurrentLineNb({
              $r: c,
              $v: parser.parse(this.getNextEmbedBlock())
            })
          )
          this.refs = parser.refs
        } else {
          if (
            this.isDefined(values.leadspaces) &&
            ' ' == values.leadspaces &&
            (matches = new RegExp(
              '^(' +
                YamlInline.REGEX_QUOTED_STRING +
                '|[^ \'"{[].*?) *:(\\s+(.+?))?\\s*$'
            ).exec(values.value))
          ) {
            matches = {
              key: matches[1],
              value: matches[3]
            }
            // this is a compact notation element, add to next block and parse
            c = this.getRealCurrentLineNb()
            parser = new YamlParser(c, this.lined)
            parser.refs = this.refs
            block = values.value

            if (!this.isNextLineIndented()) {
              block +=
                '\n' +
                this.getNextEmbedBlock(this.getCurrentLineIndentation() + 2)
            }

            //  array element
            var blockLines = block.trim().split('\n')
            var b = this.getRealLineNb(blockLines[0])
            var e = this.getRealLineNb(blockLines.pop())

            data.push({
              $r: c,
              $l: e - b + 1,
              $v: parser.parse(block)
            })
            this.refs = parser.refs
          } else {
            data.push(
              this.getRealCurrentLineNb({
                $v: this.parseValue(values.value)
              })
            )
          }
        }
      } else if (isMapping) {
        if (!this.isDefined(data)) data = {}
        if (context && 'sequence' == context) {
          throw new YamlParseException(
            'You cannot define a mapping item when in a sequence',
            this.getRealCurrentLineNb() + 1,
            this.currentLine
          )
        }
        context = 'mapping'

        values = {
          key: values[1],
          value: values[3]
        }

        try {
          key = new YamlInline().parseScalar(values.key)
        } catch (e) {
          if (e instanceof YamlParseException) {
            e.setParsedLine(this.getRealCurrentLineNb() + 1)
            e.setSnippet(this.currentLine)
          }
          throw e
        }

        if ('<<' == key) {
          if (
            this.isDefined(values.value) &&
            '*' == (values.value + '').charAt(0)
          ) {
            isInPlace = values.value.substr(1)
            if (this.refs[isInPlace] == undefined) {
              throw new YamlParseException(
                `Reference ${value} does not exist`,
                this.getRealCurrentLineNb() + 1,
                this.currentLine
              )
            }
          } else {
            if (this.isDefined(values.value) && values.value != '') {
              value = values.value
            } else {
              value = this.getNextEmbedBlock()
            }

            c = this.getRealCurrentLineNb() + 1
            parser = new YamlParser(c, this.lined)
            parser.refs = this.refs
            parsed = parser.parse(value)
            this.refs = parser.refs

            var merged = []
            if (!this.isObject(parsed)) {
              throw new YamlParseException(
                'YAML merge keys used with a scalar value instead of an array',
                this.getRealCurrentLineNb() + 1,
                this.currentLine
              )
            } else if (this.isDefined(parsed[0])) {
              // Numeric array, merge individual elements
              reverse = this.reverseArray(parsed)
              len = reverse.length
              for (i = 0; i < len; i++) {
                var parsedItem = reverse[i]
                if (!this.isObject(parsedItem)) {
                  throw new YamlParseException(
                    'Merge items must be arrays',
                    this.getRealCurrentLineNb() + 1,
                    this.currentLine
                  )
                }
                merged = this.mergeObject(parsedItem, merged)
              }
            } else {
              // Associative array, merge
              merged = this.mergeObject(merged, parsed)
            }

            isProcessed = merged
          }
        } else if (
          this.isDefined(values.value) &&
          (matches = /^&([^ ]+) *(.*)/.exec(values.value))
        ) {
          matches = {
            ref: matches[1],
            value: matches[2]
          }
          isRef = matches.ref
          values.value = matches.value
        }

        if (isProcessed) {
          // Merge keys
          data = isProcessed
        } else if (
          !this.isDefined(values.value) ||
          '' == this.trim(values.value) ||
          this.trim(values.value).charAt(0) == '#'
        ) {
          // hash
          // if next line is less indented or equal, then it means that the current value is null
          var obj = this.getRealCurrentLineNb({})
          if (
            this.isNextLineIndented() &&
            !this.isNextLineUnIndentedCollection()
          ) {
            if (data[key]) {
              throw new YamlParseException(
                `Duplicate key: ${key}`,
                this.getRealCurrentLineNb() + 1,
                this.currentLine
              )
            }
            obj.$v = null
            data[key] = obj
          } else {
            c = this.getRealCurrentLineNb() + 1
            parser = new YamlParser(c, this.lined)
            parser.refs = this.refs
            if (data[key]) {
              throw new YamlParseException(
                `Duplicate key: ${key}`,
                this.getRealCurrentLineNb() + 1,
                this.currentLine
              )
            }
            obj.$v = parser.parse(this.getNextEmbedBlock())

            obj.$l = this.lastLineNum - obj.$r + 1
            data[key] = obj
            this.refs = parser.refs
          }
        } else {
          if (isInPlace) {
            data = this.refs[isInPlace]
          } else {
            obj = this.getRealCurrentLineNb({})
            if (data[key]) {
              throw new YamlParseException(
                `Duplicate key: ${key}`,
                this.getRealCurrentLineNb() + 1,
                this.currentLine
              )
            }

            obj.$v = this.parseValue(values.value)

            // if using continuation symbol, fixup length of this obj
            if (values.value.startsWith('|-')) {
              obj.$l = this.lastLineNum - obj.$r + 1
            }
            data[key] = obj
          }
        }
      } else {
        // 1-liner followed by newline
        if (2 == this.lines.length && this.isEmpty(this.lines[1])) {
          try {
            value = new YamlInline().parse(this.lines[0])
          } catch (e) {
            if (e instanceof YamlParseException) {
              e.setParsedLine(this.getRealCurrentLineNb() + 1)
              e.setSnippet(this.currentLine)
            }
            throw e
          }

          if (this.isObject(value)) {
            var first = value[0]
            if (typeof value == 'string' && '*' == first.charAt(0)) {
              data = []
              len = value.length
              for (i = 0; i < len; i++) {
                data.push(this.refs[value[i].substr(1)])
              }
              value = data
            }
          }

          return value
        }

        throw new YamlParseException(
          'Unable to parse.',
          this.getRealCurrentLineNb() + 1,
          this.currentLine
        )
      }

      if (isRef) {
        if (data instanceof Array) this.refs[isRef] = data[data.length - 1]
        else {
          var lastKey = null
          for (var k in data) {
            if (data.hasOwnProperty(k)) lastKey = k
          }
          this.refs[isRef] = data[lastKey]
        }
      }
    }

    return this.isEmpty(data) ? null : data
  }

  getRealCurrentLineNb(obj) {
    var inxNb = this.currentLine.lastIndexOf('#')
    if (inxNb !== -1) {
      var row = parseInt(this.currentLine.substr(inxNb + 1), 10)
      if (obj) {
        obj.$r = row
        obj.$l = 1
        var inxCmt = this.currentLine.lastIndexOf('#', inxNb - 1)
        if (inxCmt !== -1) {
          obj.$cmt = this.currentLine.substring(inxCmt + 1, inxNb - 1).trim()
        }
        return obj
      } else {
        return row
      }
    }
    return this.currentLineNb + this.offset
  }

  getRealLineNb(line) {
    var row = line.lastIndexOf('#')
    if (row !== -1) {
      row = parseInt(line.substr(row + 1), 10)
    }
    return row
  }

  getCurrentLineIndentation() {
    return (
      this.currentLine.length - this.currentLine.replace(/^ +/g, '').length
    )
  }

  getNextEmbedBlock(indentation) {
    this.moveToNextLine()
    var newIndent = null
    var indent = null

    // if indentation not defined, get indentation from current line
    if (!this.isDefined(indentation)) {
      newIndent = this.getCurrentLineIndentation()

      var unindentedEmbedBlock = this.isStringUnIndentedCollectionItem(
        this.currentLine
      )

      if (
        !this.isCurrentLineEmpty() &&
        0 == newIndent &&
        !unindentedEmbedBlock
      ) {
        throw new YamlParseException(
          'Indentation problem, make sure declarations line up',
          this.getRealCurrentLineNb() + 1,
          this.currentLine
        )
      }
    } else {
      newIndent = indentation
    }

    var continuationIndent = -1
    var isUnindentedCollection = this.isStringUnIndentedCollectionItem(
      this.currentLine
    )
    if (isUnindentedCollection === true) {
      continuationIndent =
        1 + /^-((\s+)(.+?))?\s*$/.exec(this.currentLine)[2].length
    }

    var eol = null
    var num = null
    var data = [this.currentLine.substr(newIndent)]
    while (this.moveToNextLine()) {
      // building up line?
      var last = data.length - 1
      if (eol) {
        var sb = eol === '\\'
        var lastLine = this.lastLineRaw.trim()
        if (sb) {
          if (lastLine[0] === '\\') {
            lastLine = lastLine.substr(1) // remove starting \
          }
        } else {
          lastLine = ' ' + lastLine
        }
        data[last] += lastLine
        var eb = lastLine.endsWith(eol)
        if ((sb && !eb) || (!sb && eb)) {
          data[last] += ' #' + num
          //eol = null
        } else {
          continue
        }
      }
      eol = this.getEndOfLineCharacter(this.lastLineRaw)
      if (eol) {
        data[last] = this.lastLineRaw.substr(newIndent)
        if (eol === '\\') {
          data[last] = data[last].slice(0, -1) // remove ending \
        }
        num = this.lastLineNum
        continue
      }

      // block ends because the '- ' lines end
      if (
        isUnindentedCollection &&
        !this.isStringUnIndentedCollectionItem(this.currentLine) &&
        this.getCurrentLineIndentation() < continuationIndent
      ) {
        this.moveToPreviousLine()
        break
      }

      // adding comment line to block
      if (this.isCurrentLineEmpty()) {
        if (this.isCurrentLineBlank()) {
          data.push(this.currentLine.substr(newIndent))
        }
        continue
      }

      indent = this.getCurrentLineIndentation()
      var matches = /^( *)$/.exec(this.currentLine)
      if (matches) {
        // empty line
        data.push(matches[1])
      } else if (indent >= newIndent) {
        data.push(this.currentLine.substr(newIndent))
      } else if (0 == indent) {
        // ends because next line indent is less then the start of this block
        this.moveToPreviousLine()
        break
      } else {
        throw new YamlParseException(
          'Indentation problem, make sure declarations line up',
          this.getRealCurrentLineNb() + 1,
          this.currentLine
        )
      }
    }

    return data.join('\n')
  }

  getEndOfLineCharacter(str) {
    str = str.trim()
    if (str[0] !== '#') {
      if (str.endsWith('\\')) {
        return '\\'
      } else {
        var arr = str.split(':')
        if (arr.length >= 2) {
          if (arr[0].indexOf('\'') === -1 && arr[0].indexOf('"') === -1) {
            var val = arr[1].trim()
            var ci = str.indexOf('#')
            var chr = this.getEndOfLineCharacterHelper(str, ci, val, '{', '}')
            if (!chr)
              chr = this.getEndOfLineCharacterHelper(str, ci, val, '[', ']')
            return chr
          }
        }
      }
    }
    return null
  }

  getEndOfLineCharacterHelper(str, ci, val, beg, end) {
    // if starts with brace and end brace is missing or in past a comment (#)
    var bi = str.indexOf(end)
    if (val.length > 0 && (bi === -1 || (ci !== -1 && bi > ci))) {
      if (val[0] === beg) {
        return end
      }
    }
    return null
  }

  moveToNextLine() {
    if (this.currentLineNb >= this.lines.length - 1) {
      return false
    }

    this.lastLineRaw = this.currentLineRaw
    this.lastLineNum = this.getRealCurrentLineNb()
    this.currentLineNb++
    this.currentLine = this.currentLineRaw = this.lines[this.currentLineNb]
    var inx = this.currentLineRaw.lastIndexOf('#')
    if (inx !== -1) {
      this.currentLineRaw = this.currentLineRaw.substr(0, inx - 1)
    }

    return true
  }

  moveToPreviousLine() {
    this.currentLineNb--
    this.currentLine = this.currentLineRaw = this.lines[this.currentLineNb]
    var inx = this.currentLineRaw.lastIndexOf('#')
    if (inx !== -1) {
      this.currentLineRaw = this.currentLineRaw.substr(0, inx - 1)
    }
  }

  parseValue(value) {
    if ('*' == (value + '').charAt(0)) {
      if (this.trim(value).charAt(0) == '#') {
        value = (value + '').substr(1, value.indexOf('#') - 2)
      } else {
        value = (value + '').substr(1)
      }

      if (this.refs[value] == undefined) {
        throw new YamlParseException(
          `Reference ${value} does not exist`,
          this.getRealCurrentLineNb() + 1,
          this.currentLine
        )
      }
      return this.refs[value]
    }

    var matches = /^(\||>)(\+|-|\d+|\+\d+|-\d+|\d+\+|\d+-)?( +#.*)?$/.exec(
      value
    )
    if (matches) {
      matches = {
        separator: matches[1],
        modifiers: matches[2],
        comments: matches[3]
      }
      var modifiers = this.isDefined(matches.modifiers)
        ? matches.modifiers
        : ''

      return this.parseFoldedScalar(
        matches.separator,
        modifiers.replace(/\d+/g, ''),
        Math.abs(parseInt(modifiers, 10))
      )
    }
    try {
      return new YamlInline().parse(value)
    } catch (e) {
      if (e instanceof YamlParseException) {
        e.setParsedLine(this.getRealCurrentLineNb() + 1)
        e.setSnippet(this.currentLine)
      }
      throw e
    }
  }

  parseFoldedScalar(separator, indicator, indentation) {
    if (indicator == undefined) indicator = ''
    if (indentation == undefined) indentation = 0

    separator = '|' == separator ? '\n' : ' '
    var text = ''
    var diff = null

    var notEOF = this.moveToNextLine()

    while (notEOF && this.isCurrentLineBlank()) {
      text += '\n'

      notEOF = this.moveToNextLine()
    }

    if (!notEOF) {
      return ''
    }

    var matches = null
    if (
      !(matches = new RegExp(
        '^(' +
          (indentation ? this.strRepeat(' ', indentation) : ' +') +
          ')(.*)$'
      ).exec(this.currentLineRaw))
    ) {
      this.moveToPreviousLine()

      return ''
    }

    matches = {
      indent: matches[1],
      text: matches[2]
    }

    var textIndent = matches.indent
    var previousIndent = 0

    text += matches.text + separator
    while (this.currentLineNb + 1 < this.lines.length) {
      this.moveToNextLine()
      let isSequence = false
      let isMapping = false
      matches = new RegExp('^( {' + textIndent.length + ',})(.+)$').exec(
        this.currentLineRaw
      )
      isSequence = !!matches
      if (!isSequence) {
        matches = /^( *)$/.exec(this.currentLine)
        isMapping = !!matches
      }
      if (isSequence) {
        matches = {
          indent: matches[1],
          text: matches[2]
        }
        if (' ' == separator && previousIndent != matches.indent) {
          text = text.substr(0, text.length - 1) + '\n'
        }
        previousIndent = matches.indent
        diff = matches.indent.length - textIndent.length
        text +=
          this.strRepeat(' ', diff) +
          matches.text +
          (diff != 0 ? '\n' : separator)
      } else if (isMapping) {
        text +=
          matches[1].replace(
            new RegExp('^ {1,' + textIndent.length + '}', 'g'),
            ''
          ) + '\n'
      } else {
        this.moveToPreviousLine()
        break
      }
    }

    if (' ' == separator) {
      text = text.replace(/ (\n*)$/g, '\n$1')
    }

    switch (indicator) {
    case '':
      text = text.replace(/\n+$/g, '\n')
      break
    case '+':
      break
    case '-':
      text = text.replace(/\n+$/g, '')
      break
    }

    return text
  }

  isNextLineIndented() {
    var currentIndentation = this.getCurrentLineIndentation()
    var notEOF = this.moveToNextLine()

    while (notEOF && this.isCurrentLineEmpty()) {
      notEOF = this.moveToNextLine()
    }

    if (false == notEOF) {
      return false
    }

    var ret = false
    if (this.getCurrentLineIndentation() <= currentIndentation) {
      ret = true
    }

    this.moveToPreviousLine()

    return ret
  }

  isCurrentLineEmpty() {
    return this.isCurrentLineBlank() || this.isCurrentLineComment()
  }

  isCurrentLineBlank() {
    return '' == this.trim(this.currentLine)
  }

  isCurrentLineComment() {
    var ltrimmedLine = this.currentLine.replace(/^ +/g, '')
    return ltrimmedLine.charAt(0) == '#'
  }

  cleanup(value) {
    value = value
      .split('\r\n')
      .join('\n')
      .split('\r')
      .join('\n')

    if (!/\n$/.test(value)) {
      value += '\n'
    }

    // strip YAML header
    var count = 0
    var regex = /^%YAML[: ][\d.]+.*\n/
    while (regex.test(value)) {
      value = value.replace(regex, '')
      count++
    }
    this.offset += count

    // remove leading comments
    regex = /^(#.*?\n)+/
    if (regex.test(value)) {
      var trimmedValue = value.replace(regex, '')

      // items have been removed, update the offset
      this.offset +=
        this.subStrCount(value, '\n') - this.subStrCount(trimmedValue, '\n')
      value = trimmedValue
    }

    // remove start of the document marker (---)
    regex = /^---.*?\n/
    if (regex.test(value)) {
      trimmedValue = value.replace(regex, '')

      // items have been removed, update the offset
      this.offset +=
        this.subStrCount(value, '\n') - this.subStrCount(trimmedValue, '\n')
      value = trimmedValue

      // remove end of the document marker (...)
      value = value.replace(/\.\.\.\s*$/g, '')
    }

    return value
  }

  isNextLineUnIndentedCollection() {
    var currentIndentation = this.getCurrentLineIndentation()
    var notEOF = this.moveToNextLine()

    while (notEOF && this.isCurrentLineEmpty()) {
      notEOF = this.moveToNextLine()
    }

    if (false === notEOF) {
      return false
    }

    var ret = false
    if (
      this.getCurrentLineIndentation() == currentIndentation &&
      this.isStringUnIndentedCollectionItem(this.currentLine)
    ) {
      ret = true
    }

    this.moveToPreviousLine()

    return ret
  }

  isStringUnIndentedCollectionItem() {
    return 0 === this.currentLine.indexOf('- ')
  }

  isObject(input) {
    return typeof input == 'object' && this.isDefined(input)
  }

  isEmpty(input) {
    return (
      input == undefined ||
      input == null ||
      input == '' ||
      input == 0 ||
      input == '0' ||
      input == false
    )
  }

  isDefined(input) {
    return input != undefined && input != null
  }

  reverseArray(input) {
    var result = []
    var len = input.length
    for (var i = len - 1; i >= 0; i--) {
      result.push(input[i])
    }

    return result
  }

  merge(a, b) {
    var c = {}
    var i

    for (i in a) {
      if (a.hasOwnProperty(i))
        if (/^\d+$/.test(i)) c.push(a)
        else c[i] = a[i]
    }
    for (i in b) {
      if (b.hasOwnProperty(i))
        if (/^\d+$/.test(i)) c.push(b)
        else c[i] = b[i]
    }

    return c
  }

  strRepeat(str, count) {
    var i
    var result = ''
    for (i = 0; i < count; i++) result += str
    return result
  }

  subStrCount(string, subString, start, length) {
    var c = 0

    string = '' + string
    subString = '' + subString

    if (start != undefined) string = string.substr(start)
    if (length != undefined) string = string.substr(0, length)

    var len = string.length
    var sublen = subString.length
    for (var i = 0; i < len; i++) {
      if (subString == string.substr(i, sublen)) c++
      i += sublen - 1
    }

    return c
  }

  trim(str) {
    return (str + '').replace(/^ +/, '').replace(/ +$/, '')
  }
}

export default YamlParser
