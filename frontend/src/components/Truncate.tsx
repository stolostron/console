/* Copyright Contributors to the Open Cluster Management project */
import { Tooltip, TooltipPosition } from '@patternfly/react-core'
import React from 'react'
import useResizeObserver from '@react-hook/resize-observer'
import './Truncate.css'

export enum TruncatePosition {
  start = 'start',
  end = 'end',
  middle = 'middle',
}

const truncateStyles = {
  end: 'pf-v5-c-truncate__start',
  start: 'pf-v5-c-truncate__end',
}

const minWidthCharacters = 12

interface TruncateProps extends React.HTMLProps<HTMLSpanElement> {
  /** Class to add to outer span */
  className?: string
  /** Text to truncate */
  content: string
  /** The number of characters displayed in the second half of the truncation */
  trailingNumChars?: number
  /** Where the text will be truncated */
  position?: 'start' | 'middle' | 'end'
  /** Tooltip position */
  tooltipPosition?:
    | TooltipPosition
    | 'auto'
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top-start'
    | 'top-end'
    | 'bottom-start'
    | 'bottom-end'
    | 'left-start'
    | 'left-end'
    | 'right-start'
    | 'right-end'
  /** Children to render (for highlighted content) */
  children?: React.ReactNode
}

const sliceContent = (str: string, slice: number) => [str.slice(0, str.length - slice), str.slice(-slice)]

export const Truncate: React.FunctionComponent<TruncateProps> = ({
  className,
  position = 'end',
  tooltipPosition = 'top',
  trailingNumChars = 7,
  content,
  children,
  ...props
}: TruncateProps) => {
  const [isOverflowing, setIsOverflowing] = React.useState(false)
  const containerRef = React.useRef<HTMLSpanElement>(null)

  // Check if content is actually overflowing
  const checkOverflow = React.useCallback(() => {
    if (containerRef.current && (content || children)) {
      const containerElement = containerRef.current
      const textContent = content || containerElement.textContent || ''

      if (!textContent.trim()) {
        setIsOverflowing(false)
        return
      }

      const truncatedElement = containerElement.querySelector('.pf-v5-c-truncate__start, .pf-v5-c-truncate__end')

      if (truncatedElement && truncatedElement.scrollWidth > 0) {
        const isOverflowing = truncatedElement.scrollWidth > truncatedElement.clientWidth
        setIsOverflowing(isOverflowing)
      } else {
        // CSS not ready or no truncate element - use measurement fallback
        const measureSpan = document.createElement('span')
        measureSpan.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;top:-9999px;'
        measureSpan.textContent = textContent

        const computedStyle = window.getComputedStyle(containerElement)
        measureSpan.style.fontSize = computedStyle.fontSize
        measureSpan.style.fontFamily = computedStyle.fontFamily
        measureSpan.style.fontWeight = computedStyle.fontWeight

        document.body.appendChild(measureSpan)
        const textWidth = measureSpan.offsetWidth
        document.body.removeChild(measureSpan)

        const containerWidth = containerElement.clientWidth
        setIsOverflowing(textWidth > containerWidth)
      }
    } else {
      setIsOverflowing(false)
    }
  }, [content, children])

  // Check overflow when content or children change, and on initial render
  React.useLayoutEffect(() => {
    // Immediate check for content changes
    checkOverflow()

    // Additional check after paint for initial render accuracy
    const checkAfterRender = () => {
      if (containerRef.current && containerRef.current.offsetWidth > 0) {
        // Element is ready, check overflow
        checkOverflow()
      } else {
        // Element not ready yet, try again after next frame
        requestAnimationFrame(checkAfterRender)
      }
    }

    requestAnimationFrame(checkAfterRender)
  }, [content, children, checkOverflow])

  // Check overflow when container size changes (with requestAnimationFrame for layout stability)
  useResizeObserver(
    containerRef,
    React.useCallback(() => {
      // Use requestAnimationFrame to ensure measurement happens after layout
      requestAnimationFrame(checkOverflow)
    }, [checkOverflow])
  )

  // Also listen to window resize as backup
  React.useEffect(() => {
    const handleWindowResize = () => {
      requestAnimationFrame(checkOverflow)
    }

    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [checkOverflow])

  // When children are provided (highlighted content), use PatternFly truncation with children
  if (children) {
    const truncateContent = (
      <span ref={containerRef} className={`${className || ''} pf-v5-c-truncate`} {...props}>
        <span className="pf-v5-c-truncate__start">{children}</span>
      </span>
    )

    return isOverflowing ? (
      <Tooltip position={tooltipPosition} content={children}>
        {truncateContent}
      </Tooltip>
    ) : (
      truncateContent
    )
  }

  // Original truncation logic for plain text
  const plainTextContent = (
    <span ref={containerRef} className={`${className || ''} pf-v5-c-truncate`} {...props}>
      {(position === TruncatePosition.end || position === TruncatePosition.start) && (
        <span className={truncateStyles[position]}>
          {content}
          {position === TruncatePosition.start && <React.Fragment>&lrm;</React.Fragment>}
        </span>
      )}
      {position === TruncatePosition.middle &&
        content.slice(0, content.length - trailingNumChars).length > minWidthCharacters && (
          <React.Fragment>
            <span className={truncateStyles.start}>{sliceContent(content, trailingNumChars)[0]}</span>
            <span className={truncateStyles.end}>{sliceContent(content, trailingNumChars)[1]}</span>
          </React.Fragment>
        )}
      {position === TruncatePosition.middle &&
        content.slice(0, content.length - trailingNumChars).length <= minWidthCharacters &&
        content}
    </span>
  )

  return isOverflowing ? (
    <Tooltip position={tooltipPosition} content={content}>
      {plainTextContent}
    </Tooltip>
  ) : (
    plainTextContent
  )
}
Truncate.displayName = 'Truncate'
