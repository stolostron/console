/* Copyright Contributors to the Open Cluster Management project */
import { Button, ContextSelectorFooter } from '@patternfly/react-core'
import { Fragment } from 'react'

import { useTranslation } from '../lib/acm-i18next'
export interface ICreateCredentialModalProps {
  handleModalToggle: () => void
  buttonText?: string
}

export function CreateCredentialModal(props: ICreateCredentialModalProps) {
  const { t } = useTranslation()
  const { handleModalToggle, buttonText = t('Add credential') } = props

  return (
    <Fragment>
      <ContextSelectorFooter>
        <Button onClick={handleModalToggle} variant="link" isInline>
          {buttonText}
        </Button>
      </ContextSelectorFooter>
    </Fragment>
  )
}
