/* Copyright Contributors to the Open Cluster Management project */
import { Tooltip, TooltipPosition } from '@patternfly/react-core'
import useResizeObserver from '@react-hook/resize-observer'
import React from 'react'
import './Truncate.css'

export enum TruncatePosition {
  start = 'start',
  end = 'end',
  middle = 'middle',
}

const truncateStyles = {
  start: 'pf-v6-c-truncate__end',
  end: 'pf-v6-c-truncate__start',
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
  /** Whether this is a link (affects tooltip styling) */
  isLink?: boolean
}

const sliceContent = (str: string, slice: number) => [str.slice(0, str.length - slice), str.slice(-slice)]

// Helper function to create styled tooltip content
const createTooltipContent = (children: React.ReactNode, content: string, isLink: boolean) => {
  // Helper to extract text content and create styled HTML
  const createStyledTooltipElement = (element: React.ReactElement): React.ReactElement => {
    const PF_VAR_WHITE = 'var(--pf-t--color--white)'
    const PF_VAR_LINK_COLOR = 'var(--pf-t--global--text--color--link--default)'

    if (React.isValidElement(element)) {
      const props = element.props as any
      let style: React.CSSProperties = {}

      // Apply tooltip-specific styling based on data attributes
      const isHighlighted = props['data-highlight'] === 'true'
      const isLinkText = props['data-link'] === 'true' || isLink

      if (isHighlighted) {
        // Highlighted search matches: bold and underlined
        style = {
          fontWeight: 'bold',
          textDecoration: 'underline',
          color: isLink ? PF_VAR_LINK_COLOR : 'inherit',
        }
      } else if (isLinkText && isLink) {
        // Link text (highlighted or not): white color
        style = {
          color: PF_VAR_WHITE,
        }
      }

      const textContent = props.children

      return <span style={style}>{textContent}</span>
    }
    return element
  }

  // Handle different types of children
  if (children) {
    // Handle array of elements (like from segments.map())
    if (Array.isArray(children)) {
      return (
        <>
          {children.map((child, index) => {
            if (React.isValidElement(child)) {
              // Use existing key or generate stable key based on content
              const stableKey =
                child.key || `tooltip-child-${index}-${String((child.props as any)?.children || '').slice(0, 10)}`
              return React.cloneElement(createStyledTooltipElement(child), { key: stableKey })
            }
            return child
          })}
        </>
      )
    }

    // Handle single React element
    if (React.isValidElement(children)) {
      return createStyledTooltipElement(children)
    }

    // Handle React fragments or other complex node types
    const childrenArray = React.Children.toArray(children)
    if (childrenArray.length > 0) {
      return (
        <>
          {childrenArray.map((child, index) => {
            if (React.isValidElement(child)) {
              // Use existing key or generate stable key based on content
              const stableKey =
                child.key || `tooltip-fragment-${index}-${String(child.props?.children || '').slice(0, 10)}`
              return React.cloneElement(createStyledTooltipElement(child), { key: stableKey })
            }
            return child
          })}
        </>
      )
    }
  }

  // Fallback to plain content
  return content
}

export const Truncate: React.FunctionComponent<TruncateProps> = ({
  className,
  position = 'end',
  tooltipPosition = 'top',
  trailingNumChars = 7,
  content,
  children,
  isLink = false,
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

      const truncatedElement = containerElement.querySelector('.pf-v6-c-truncate__start, .pf-v6-c-truncate__end')

      if (truncatedElement && truncatedElement.scrollWidth > 0) {
        const isOverflowing = truncatedElement.scrollWidth > truncatedElement.clientWidth
        setIsOverflowing(isOverflowing)
      } else {
        // In cases where the truncated element is not yet available (first render), we need to measure the text width ahead of time
        // We create a hidden span element and measure its width
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
      <span ref={containerRef} className={`${className || ''} pf-v6-c-truncate`} {...props}>
        <span className="pf-v6-c-truncate__start">{children}</span>
      </span>
    )

    const tooltipContent = createTooltipContent(children, content, isLink)

    return isOverflowing ? (
      <Tooltip position={tooltipPosition} content={tooltipContent}>
        {truncateContent}
      </Tooltip>
    ) : (
      truncateContent
    )
  }

  // Original truncation logic for plain text
  const plainTextContent = (
    <span ref={containerRef} className={`${className || ''} pf-v6-c-truncate`} {...props}>
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
