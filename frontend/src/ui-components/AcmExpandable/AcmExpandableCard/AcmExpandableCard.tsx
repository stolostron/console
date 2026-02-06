/* Copyright Contributors to the Open Cluster Management project */

import { css } from '@emotion/css'
import { useState } from 'react'
import { Card, CardBody, CardExpandableContent, CardHeader, CardTitle } from '@patternfly/react-core'
import { useTranslation } from '../../../lib/acm-i18next'

/** Ensures flex content (e.g. terminology paragraphs) can shrink and wrap so text is fully visible. */
const expandableCardContent = css({
  // '& .pf-v6-c-card__expandable-content': { minWidth: 0 },
  // '& .pf-v6-c-card__body': { minWidth: 0 },
  // '& .pf-v6-l-flex': { minWidth: 0 },
  // '& .pf-v6-l-flex__item:first-child': { minWidth: 0, flex: '1 1 0' },
})

const onToggle = (acmCardID: string, open: boolean, setOpen: (open: boolean) => void) => {
  setOpen(!open)
  if (localStorage.getItem(acmCardID) === 'show') {
    localStorage.setItem(acmCardID, 'hide')
  } else {
    localStorage.setItem(acmCardID, 'show')
  }
}

export function AcmExpandableCard(
  props: Readonly<{
    title: string
    children: React.ReactNode
    className?: string
    id?: string
    defaultOpen?: boolean
  }>
) {
  const acmCardID = window.location.href + props.id
  if (!localStorage.getItem(acmCardID)) {
    localStorage.setItem(acmCardID, 'show')
  }

  const [open, setOpen] = useState<boolean>(props.defaultOpen ?? localStorage.getItem(acmCardID) === 'show')
  const { t } = useTranslation()
  return (
    <Card id={props.id} className={props.className} isExpanded={open} isFullHeight>
      <CardHeader
        onExpand={() => onToggle(acmCardID, open, setOpen)}
        toggleButtonProps={{
          id: 'toggle-button',
          'aria-label': t('Toggle details'),
          'aria-expanded': open,
        }}
      >
        <CardTitle>{props.title}</CardTitle>
      </CardHeader>
      <CardExpandableContent>
        <CardBody>{props.children}</CardBody>
      </CardExpandableContent>
    </Card>
  )
}
