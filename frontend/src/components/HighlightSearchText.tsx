/* Copyright Contributors to the Open Cluster Management project */
import { css } from '@emotion/css'
import { Button, Popover } from '@patternfly/react-core'
import { parseLabel } from '../resources/utils'
import { MouseEventHandler, ReactNode } from 'react'
import { useTranslation } from '../lib/acm-i18next'
import { TFunction } from 'react-i18next'

const MAX_LABEL_WIDTH = 28

const buttonDivClass = css({
  '&:hover > button:after': {
    borderColor: 'rgb(21, 21, 21) !important',
  },
  '&:hover > button': {
    backgroundColor: 'white !important',
  },
})

const buttonClass = css({
  padding: '4px 0px !important',
  lineHeight: '10px !important',
  margin: '0 2px',
  minWidth: '16px',
})

const highlightClass = css({
  color: 'var(--pf-v5-global--link--Color)',
  textDecoration: 'underline',
  background: 'none',
  fontWeight: 600,
})

const labelWithPopOver = (completeLabel: string, truncatedLabel: string | ReactNode, t: TFunction) => (
  <Popover
    triggerAction="hover"
    position="top-start"
    aria-label={t('Label popover')}
    hasAutoWidth
    bodyContent={<div>{completeLabel}</div>}
  >
    <div>{truncatedLabel}</div>
  </Popover>
)

// render text with highlights for searched filter text
// if text is a label like 'key=value', add a toggle button that toggles between = and !=
// if truncate is set, also make label smaller with ellipses
export function HighlightSearchText(
  props: Readonly<{
    text?: string
    searchText?: string
    supportsInequality?: boolean
    toggleEquality?: () => void
    isTruncate?: boolean
    useTruncatePopover?: boolean
  }>
) {
  const { text, searchText, supportsInequality, toggleEquality, isTruncate, useTruncatePopover } = props
  const segments = getSlicedText(text, searchText)
  const { t } = useTranslation()
  const isTruncateLabel = isTruncate && text && text.length > MAX_LABEL_WIDTH
  if (segments.length > 1) {
    const highlightedTextSegments = segments.map((seg, inx) => {
      if (supportsInequality && !!parseLabel(seg.text).oper) {
        return <ToggleButton key={Number(inx)} label={seg.text} toggleEquality={toggleEquality} />
      }
      return (
        <span key={Number(inx)} className={seg.isBold ? highlightClass : ''}>
          {isTruncateLabel && !seg.isBold ? '...' : seg.text}
        </span>
      )
    })
    if (isTruncateLabel && useTruncatePopover) {
      return labelWithPopOver(text, highlightedTextSegments, t)
    }
    return <>{highlightedTextSegments}</>
  } else if (isTruncate) {
    const truncatedText = truncate(text)
    if (truncatedText && isTruncateLabel && useTruncatePopover) {
      return labelWithPopOver(text, truncatedText, t)
    }
    return truncatedText ?? null
  } else if (supportsInequality && text) {
    return <ToggleButton label={text} toggleEquality={toggleEquality} />
  }
  return text ?? null
}

interface ToggleButtonProps {
  label: string
  toggleEquality?: MouseEventHandler<HTMLButtonElement>
}

const ToggleButton = ({ label, toggleEquality }: ToggleButtonProps) => {
  const { prefix, oper, suffix } = parseLabel(label)
  return (
    <div className={buttonDivClass}>
      <span>{prefix}</span>
      <Button variant="plain" className={buttonClass} onClick={toggleEquality}>
        {oper}
      </Button>
      <span style={{ marginRight: '4px' }}>{suffix}</span>
    </div>
  )
}

interface SlicedText {
  text: string
  isBold: boolean
}

export const truncate = (label?: string) => {
  return label && label?.length > MAX_LABEL_WIDTH
    ? label.slice(0, MAX_LABEL_WIDTH / 3) + '..' + label.slice((-MAX_LABEL_WIDTH * 2) / 3)
    : label
}

const getSlicedText = (itemId: string = '', filterText: string = ''): SlicedText[] => {
  const slicedText = []
  if (filterText) {
    const lcs = lcss(itemId, filterText)
    let pos = 0

    lcs.forEach(({ beg, end }) => {
      slicedText.push({ text: itemId.slice(pos, beg), isBold: false })
      slicedText.push({ text: itemId.slice(beg, end + 1), isBold: true })
      pos = end + 1
    })
    if (pos < itemId.length) {
      slicedText.push({ text: itemId.slice(pos), isBold: false })
    }
  } else {
    return [{ text: itemId, isBold: false }]
  }
  return slicedText
}

const lcs = (str1: string, str2: string) => {
  let sequence = ''
  const str1Length = str1.length
  const str2Length = str2.length
  const num = new Array(str1Length)
  let maxlen = 0
  let lastSubsBegin = 0
  let i = 0
  let j = 0
  while (i < str1Length) {
    // create an array the length of the 2nd string
    // to count the number of times a character is present in both strings
    const subArray = new Array(str2Length)
    j = 0
    while (j < str2Length) {
      subArray[j] = 0
      j += 1
    }
    num[i] = subArray
    i += 1
  }
  let thisSubsBegin = null
  i = 0
  while (i < str1Length) {
    j = 0
    while (j < str2Length) {
      // if the characters don't match, set count to 0
      // also set matching spaces to 0 since we are replacing previouly found
      //  matches above with spaces, we don't want spaces to match either
      // otherwise the spaces in these two strings '987   89' and '873   '
      //  will be returned as the longest common string instead of 87
      if (str1[i] !== str2[j] || (str1[i] === ' ' && str2[j] === ' ')) {
        num[i][j] = 0
      } else {
        if (i === 0 || j === 0) {
          num[i][j] = 1
        } else {
          num[i][j] = 1 + num[i - 1][j - 1]
        }
        if (num[i][j] > maxlen) {
          maxlen = num[i][j]
          thisSubsBegin = i - num[i][j] + 1
          if (lastSubsBegin === thisSubsBegin) {
            sequence += str1[i]
          } else {
            lastSubsBegin = thisSubsBegin
            sequence = str1.substring(lastSubsBegin, i + 1)
          }
        }
      }
      j += 1
    }
    i += 1
  }
  return sequence
}

// find the longest common string between two strings
// iow for these two strings 873456 and 98745687 the longest common string is 456
// we use this to find the characters that match with the search term in order to boldface it
const lcss = (str1: string, str2: string) => {
  let matches
  let item = str1
  let find = str2
  let ret: { beg: number; end: number }[] = []
  do {
    // find all occurances of current longest string
    // save them and replace with spaces
    let match
    matches = []
    let res = lcs(item, find)
    if (res.length > 0) {
      // escape search pattern (ex: if there's a period, escape to \\.)
      const { length: len } = res
      res = res.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&')
      const regex = new RegExp(res, 'g')
      do {
        match = regex.exec(item)
        if (match) matches.push(match)
      } while (match !== null)
      if (matches.length) {
        ret = [
          ...ret,
          ...matches.map((match) => {
            const beg = match.index
            const end = beg + match[0].length - 1
            return { beg, end }
          }),
        ]
        // so that we don't constantly find the same matches over and over again
        // we replace the matching characters with spaces
        // iow the above strings (873456 and 98745687) become '987   87' and '873   ' so that 456 isn't found again
        item = item.replace(regex, () => ' '.repeat(len))
        find = find.replace(regex, () => ' '.repeat(len))
      }
    }
  } while (find.length && matches.length)

  // longest common strings will be found out of order
  // but when we create the string it needs in order
  ret.sort(({ beg: begA }, { beg: begB }) => begA - begB)

  return ret
}
