/* Copyright Contributors to the Open Cluster Management project */
import { Button, ContextSelectorFooter } from '@patternfly/react-core'
import { Fragment } from 'react'

import { useTranslation } from '../lib/acm-i18next'
export interface ICreateCredentialModalProps {
  control?: any
  handleModalToggle: (affectedControl: any) => void
}

export function CreateCredentialModal(props: ICreateCredentialModalProps) {
  const { t } = useTranslation()
  const { control, handleModalToggle } = props

  return (
    <Fragment>
      <ContextSelectorFooter>
        <Button
          onClick={
            control
              ? () => {
                  handleModalToggle(control)
                }
              : handleModalToggle
          }
          variant="link"
          isInline
        >
          {t('Add credential')}
        </Button>
      </ContextSelectorFooter>
    </Fragment>
  )
}
