/* Copyright Contributors to the Open Cluster Management project */

import { Alert, AlertVariant, ButtonVariant } from '@patternfly/react-core'
import { AcmButton } from '../../../../../ui-components'
import { Link } from 'react-router-dom-v5-compat'
import { createContext, useContext } from 'react'

export type WarningContextType =
  | { title: string; text: string; linkTo?: string; linkText?: string; isExternalLink?: boolean }
  | undefined

export const WarningContext = createContext<WarningContextType>(undefined)

export const Warning = () => {
  const warning = useContext(WarningContext)

  if (!warning) {
    return null
  }

  let actionLinks
  if (warning.linkTo) {
    actionLinks = warning.isExternalLink ? (
      <a href={warning.linkTo} target="_blank" rel="noopener noreferrer" style={{ paddingLeft: 0 }}>
        {warning.linkText}
      </a>
    ) : (
      <Link to={warning.linkTo}>
        <AcmButton variant={ButtonVariant.link} style={{ paddingLeft: 0 }}>
          {warning.linkText}
        </AcmButton>
      </Link>
    )
  }

  return (
    <>
      <Alert title={warning?.title} variant={AlertVariant.warning} actionLinks={actionLinks} isInline>
        {warning.text}
      </Alert>
      <br />
    </>
  )
}
