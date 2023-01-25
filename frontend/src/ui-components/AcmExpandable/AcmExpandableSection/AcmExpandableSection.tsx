/* Copyright Contributors to the Open Cluster Management project */

import { ExpandableSection } from '@patternfly/react-core'
import { ReactNode, useState, useEffect, CSSProperties } from 'react'

export function AcmExpandableSection(props: {
  label: string
  children: ReactNode
  summary?: string
  expanded?: boolean
  hidden?: boolean
  style?: CSSProperties
}) {
  const [expanded, setExpanded] = useState(props.expanded === true)
  useEffect(() => {
    if (props.expanded !== undefined && props.expanded !== expanded) {
      setExpanded(props.expanded)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.expanded])

  if (props.hidden) return <></>
  return (
    <ExpandableSection
      toggleText={props.summary && !expanded ? `${props.label} - ${props.summary}` : props.label}
      onToggle={() => {
        setExpanded(!expanded)
      }}
      isExpanded={expanded}
      {...props}
    >
      <div style={{ paddingLeft: '24px' }}>{props.children}</div>
    </ExpandableSection>
  )
}
