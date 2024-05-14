/* Copyright Contributors to the Open Cluster Management project */
import { ButtonVariant, ModalVariant } from '@patternfly/react-core'
import { Fragment, useMemo } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { NavigationPath } from '../../../../../NavigationPath'
import { Cluster } from '../../../../../resources'
import { AcmButton, AcmModal } from '../../../../../ui-components'
import { GetUrlSearchParam } from '../../searchDefinitions'

export interface IDeleteExternalResourceModalProps {
  open: boolean
  close: () => void
  resource: any
  hubCluster?: Cluster
}

export const ClosedDeleteExternalResourceModalProps: IDeleteExternalResourceModalProps = {
  open: false,
  close: () => {},
  resource: undefined,
  hubCluster: undefined,
}

export const DeleteExternalResourceModal = (props: IDeleteExternalResourceModalProps) => {
  const { open, close, resource, hubCluster } = props
  const { t } = useTranslation()

  const externalLink = useMemo(() => {
    if (resource) {
      const consoleURL = hubCluster?.consoleURL
      const params = GetUrlSearchParam(resource)
      return `${consoleURL}${NavigationPath.resources}${params}`
    }
    return ''
  }, [resource, hubCluster])

  return (
    <Fragment>
      <AcmModal
        title={t('Delete {{resourceKind}}?', { resourceKind: resource?.kind })}
        variant={ModalVariant.small}
        isOpen={open}
        onClose={close}
        actions={[
          <AcmButton
            isDisabled={externalLink === ''}
            key="confirm"
            variant={ButtonVariant.primary}
            onClick={() => {
              window.open(externalLink, '_blank')
              close()
            }}
          >
            {t('Launch to cluster')}
          </AcmButton>,
          <AcmButton key="cancel" variant={ButtonVariant.secondary} onClick={close}>
            {t('Cancel')}
          </AcmButton>,
        ]}
      >
        <p>
          {t(
            'Delete is not supported for managed cluster resources in the global context. To delete this resource, please navigate to the details page on the managed hub.'
          )}
        </p>
      </AcmModal>
    </Fragment>
  )
}
