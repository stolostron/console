/* Copyright Contributors to the Open Cluster Management project */
import React from 'react'
import { Alert, AlertVariant, ButtonVariant } from '@patternfly/react-core'
import { AcmButton } from '@open-cluster-management/ui-components'
import { Link } from 'react-router-dom'

export type WarningContextType = { title: string; text: string; linkTo?: string; linkText?: string } | undefined

export const WarningContext = React.createContext<WarningContextType>(undefined)

export const Warning = () => {
    const warning = React.useContext(WarningContext)

    if (!warning) {
        return null
    }

    let actionLinks
    if (warning.linkTo) {
        actionLinks = (
            <Link to={warning.linkTo}>
                <AcmButton variant={ButtonVariant.link} style={{ paddingLeft: 0 }}>
                    {warning.linkText}
                </AcmButton>
            </Link>
        )
    }

    return (
        <Alert title={warning?.title} variant={AlertVariant.warning} actionLinks={actionLinks} isInline>
            {warning.text}
        </Alert>
    )
}
