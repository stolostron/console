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
  start: 'pf-v5-c-truncate__start',
  end: 'pf-v5-c-truncate__end',
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
  const truncateRef = React.useRef<HTMLSpanElement>(null)
  const containerRef = React.useRef<HTMLSpanElement>(null)

  // Check if content is actually overflowing
  const checkOverflow = React.useCallback(() => {
    if (truncateRef.current && containerRef.current) {
      const innerElement = truncateRef.current
      const containerElement = containerRef.current
      const isActuallyOverflowing = innerElement.scrollWidth > containerElement.clientWidth

      setIsOverflowing(isActuallyOverflowing)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, isOverflowing])

  // Check overflow when content or children change
  React.useLayoutEffect(() => {
    checkOverflow()
  }, [content, children, checkOverflow])

  // Check overflow when container size changes (with slight delay for layout stability)
  useResizeObserver(
    containerRef,
    React.useCallback(() => {
      // Small delay to ensure layout has stabilized
      setTimeout(checkOverflow, 10)
    }, [checkOverflow])
  )

  // Also listen to window resize as backup
  React.useEffect(() => {
    const handleWindowResize = () => {
      setTimeout(checkOverflow, 50)
    }

    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [checkOverflow])

  // When children are provided (highlighted content), use PatternFly truncation with children
  if (children) {
    const truncateContent = (
      <span ref={containerRef} className={`${className || ''} pf-v5-c-truncate`} {...props}>
        <span ref={truncateRef} className="pf-v5-c-truncate__start">
          {children}
        </span>
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
        <span ref={truncateRef} className={truncateStyles[position]}>
          {content}
          {position === TruncatePosition.start && <React.Fragment>&lrm;</React.Fragment>}
        </span>
      )}
      {position === TruncatePosition.middle &&
        content.slice(0, content.length - trailingNumChars).length > minWidthCharacters && (
          <React.Fragment>
            <span ref={truncateRef} className={truncateStyles.start}>
              {sliceContent(content, trailingNumChars)[0]}
            </span>
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
