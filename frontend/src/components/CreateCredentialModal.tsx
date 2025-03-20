/* Copyright Contributors to the Open Cluster Management project */
import { Button, MenuFooter } from '@patternfly/react-core'

import { useTranslation } from '../lib/acm-i18next'
export interface ICreateCredentialModalProps {
  handleModalToggle: () => void
  buttonText?: string
}

export function CreateCredentialModal(props: ICreateCredentialModalProps) {
  const { t } = useTranslation()
  const { handleModalToggle, buttonText = t('Add credential') } = props

  return (
    <MenuFooter>
      <Button onClick={handleModalToggle} variant="link" isInline>
        {buttonText}
      </Button>
    </MenuFooter>
  )
}
