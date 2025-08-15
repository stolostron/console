/* Copyright Contributors to the Open Cluster Management project */
import { css } from '@emotion/css'
import { Button } from '@patternfly/react-core'
import { parseLabel } from '../resources/utils'
import { Truncate } from './Truncate'

const buttonDivClass = css({
  '&:hover > button:after': {
    borderColor: 'rgb(21, 21, 21)',
  },
  '&:hover > button': {
    backgroundColor: 'white',
  },
})

const buttonClass = css({
  padding: '4px 0px',
  lineHeight: '10px',
  margin: '0 2px',
  minWidth: '16px',
  // Higher specificity to override PatternFly button styles
  '&.pf-v5-c-button.pf-m-plain': {
    padding: '4px 0px',
    lineHeight: '10px',
  },
})

const highlightClass = css({
  color: 'var(--pf-v5-global--link--Color)',
  textDecoration: 'underline',
  background: 'none',
  fontWeight: 600,
  // Higher specificity to ensure underline is preserved
  '&[data-highlight="true"]': {
    textDecoration: 'underline',
  },
})

const linkClass = css({
  color: 'var(--pf-v5-global--link--Color)',
  textDecoration: 'underline',
  background: 'none',
  fontWeight: 'normal',
  // Higher specificity to ensure underline is preserved
  '&[data-link="true"]': {
    textDecoration: 'underline',
  },
})

// Helper function to create highlighted text segments
const createHighlightedSegments = (text: string, searchText: string) => {
  if (!searchText) return [{ text, isMatch: false, key: `${text}-0-false` }]

  const segments: { text: string; isMatch: boolean; key: string }[] = []
  const searchLower = searchText.toLowerCase()
  const textLower = text.toLowerCase()

  let lastIndex = 0
  let searchIndex = textLower.indexOf(searchLower)

  while (searchIndex !== -1) {
    // Add non-matching segment before the match
    if (searchIndex > lastIndex) {
      const segmentText = text.slice(lastIndex, searchIndex)
      segments.push({
        text: segmentText,
        isMatch: false,
        key: `${segmentText}-${lastIndex}-false`,
      })
    }

    // Add matching segment using the actual found match length
    const matchText = text.slice(searchIndex, searchIndex + searchLower.length)
    segments.push({
      text: matchText,
      isMatch: true,
      key: `${matchText}-${searchIndex}-true`,
    })

    lastIndex = searchIndex + searchLower.length
    searchIndex = textLower.indexOf(searchLower, lastIndex)
  }

  // Add remaining non-matching segment
  if (lastIndex < text.length) {
    const segmentText = text.slice(lastIndex)
    segments.push({
      text: segmentText,
      isMatch: false,
      key: `${segmentText}-${lastIndex}-false`,
    })
  }

  return segments
}

// render text with highlights for searched filter text
// if text is a label like 'key=value', add a toggle button that toggles between = and !=
// truncation is always handled by the Truncate component
export function HighlightSearchText(
  props: Readonly<{
    text?: string
    searchText?: string
    supportsInequality?: boolean
    toggleEquality?: () => void
    isLink?: boolean
  }>
) {
  const { text, searchText, supportsInequality, toggleEquality, isLink } = props

  if (!text) return null

  // Handle toggle button case for inequality operators
  if (supportsInequality && parseLabel(text).oper) {
    return <ToggleButton label={text} toggleEquality={toggleEquality} />
  }

  // Handle link rendering (with or without search highlighting)
  if (isLink) {
    let content
    if (searchText) {
      const segments = createHighlightedSegments(text, searchText)
      if (segments.some((seg) => seg.isMatch)) {
        // Link with search highlighting
        content = segments.map((segment) => (
          <span
            key={segment.key}
            className={segment.isMatch ? highlightClass : linkClass}
            data-highlight={segment.isMatch ? 'true' : undefined}
            data-link="true"
          >
            {segment.text}
          </span>
        ))
      } else {
        // Fallback to simple link
        content = (
          <span className={linkClass} data-link="true">
            {text}
          </span>
        )
      }
    } else {
      // Simple link without search
      content = (
        <span className={linkClass} data-link="true">
          {text}
        </span>
      )
    }

    return (
      <Truncate content={text} position="end" isLink={true}>
        {content}
      </Truncate>
    )
  }

  // Handle search highlighting (non-link)
  if (searchText) {
    const segments = createHighlightedSegments(text, searchText)

    // Only create segments if there are actual matches
    if (segments.some((seg) => seg.isMatch)) {
      const highlightedContent = (
        <>
          {segments.map((segment) => (
            <span
              key={segment.key}
              className={segment.isMatch ? highlightClass : ''}
              data-highlight={segment.isMatch ? 'true' : undefined}
            >
              {segment.text}
            </span>
          ))}
        </>
      )

      return (
        <Truncate content={text} position="end">
          {highlightedContent}
        </Truncate>
      )
    }
  }

  // Default case - truncate the text using position="end" to avoid fragmentation
  return <Truncate content={text} position="end" />
}

interface ToggleButtonProps {
  label: string
  toggleEquality?: () => void
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
