/* Copyright Contributors to the Open Cluster Management project */
import * as React from 'react'
import { getParentScrollableElement } from './utils'

type WithScrollContainerProps = {
  children: (scrollContainer: HTMLElement) => React.ReactElement | null
}

export const WithScrollContainer: React.FC<WithScrollContainerProps> = ({ children }) => {
  const [scrollContainer, setScrollContainer] = React.useState<HTMLElement>()
  const ref = React.useCallback((node: HTMLElement) => {
    if (node) {
      setScrollContainer(getParentScrollableElement(node))
    }
  }, [])

  return scrollContainer ? children(scrollContainer) : <span ref={ref} />
}
