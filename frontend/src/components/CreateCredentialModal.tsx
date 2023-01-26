/* Copyright Contributors to the Open Cluster Management project */
import { Button, ContextSelectorFooter } from '@patternfly/react-core'
import { Fragment } from 'react'

import { useTranslation } from '../lib/acm-i18next'
export interface ICreateCredentialModalProps {
  control: any
  handleModalToggle: (affectedControl: any) => void
}

export function CreateCredentialModal(props: ICreateCredentialModalProps) {
  const { t } = useTranslation()

  return (
      <Fragment>
          <ContextSelectorFooter>
              <Button
                  onClick={() => {
                      props.handleModalToggle(props.control)
                  }}
                  variant="link"
                  isInline
              >
                  {t('Add credential')}
              </Button>
          </ContextSelectorFooter>
      </Fragment>
  )
}
}
