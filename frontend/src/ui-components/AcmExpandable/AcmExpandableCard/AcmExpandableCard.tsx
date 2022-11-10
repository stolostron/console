/* Copyright Contributors to the Open Cluster Management project */

import { useState } from 'react'
import { Card, CardBody, CardExpandableContent, CardHeader, CardTitle } from '@patternfly/react-core'
import { useTranslation } from '../../../lib/acm-i18next'

const onToggle = (acmCardID: string, open: boolean, setOpen: (open: boolean) => void) => {
    setOpen(!open)
    if (localStorage.getItem(acmCardID) === 'show') {
        localStorage.setItem(acmCardID, 'hide')
    } else {
        localStorage.setItem(acmCardID, 'show')
    }
}

export function AcmExpandableCard(props: {
    title: string
    children: React.ReactNode
    className?: string
    id?: string
}) {
    const acmCardID = window.location.href + props.id
    localStorage.getItem(acmCardID) ?? localStorage.setItem(acmCardID, 'show')

    const [open, setOpen] = useState<boolean>(localStorage.getItem(acmCardID) === 'show')
    const { t } = useTranslation()
    return (
        <Card id={props.id} className={props.className} isExpanded={open}>
            <CardHeader
                onExpand={() => onToggle(acmCardID, open, setOpen)}
                onClick={() => onToggle(acmCardID, open, setOpen)}
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
