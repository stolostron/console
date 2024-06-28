/* Copyright Contributors to the Open Cluster Management project */

import { ButtonVariant, ModalVariant } from '@patternfly/react-core'
import { Fragment, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../../lib/acm-i18next'
import { canUser } from '../../../../lib/rbac-util'
import { NavigationPath } from '../../../../NavigationPath'
import { deleteResource, fireManagedClusterAction, IResource } from '../../../../resources'
import { AcmAlert, AcmButton, AcmModal } from '../../../../ui-components'

interface Props {
  open: boolean
  close: () => void
  resource: IResource
  cluster: string
}

export const DeleteResourceModal = (props: Props) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { open, close, resource, cluster } = props
  const [canDelete, setCanDelete] = useState<boolean>(false)
  const [loadingAccessRequest, setLoadingAccessRequest] = useState<boolean>(true)
  const [accessError, setAccessError] = useState(null)
  const [deleteResourceError, setDeleteResourceError] = useState(undefined)

  useEffect(() => {
    if (open && resource) {
      const canDeleteResource = canUser(
        'delete',
        {
          apiVersion: resource?.apiVersion,
          kind: resource.kind,
          metadata: {
            name: resource.metadata?.name,
            namespace: resource.metadata?.namespace,
          },
        },
        cluster === 'local-cluster' ? resource.metadata?.namespace : cluster,
        resource.metadata?.name
      )

      canDeleteResource.promise
        .then((result) => {
          setLoadingAccessRequest(false)
          setCanDelete(result.status?.allowed!)
        })
        .catch((err) => {
          console.error(err)
          setLoadingAccessRequest(false)
          setAccessError(err)
        })
      return () => canDeleteResource.abort()
    }
  }, [open, resource, cluster])

  return (
    <Fragment>
      <AcmModal
        id={'remove-resource-modal'}
        variant={ModalVariant.medium}
        isOpen={open}
        title={t('Delete {{resourceKind}}?', { resourceKind: resource?.kind })}
        titleIconVariant={'warning'}
        onClose={close}
        actions={[
          <AcmButton
            id={'delete-resource-button'}
            isDisabled={loadingAccessRequest || !canDelete}
            key="confirm"
            variant={ButtonVariant.danger}
            onClick={() => {
              if (cluster === 'local-cluster') {
                deleteResource({
                  apiVersion: resource?.apiVersion,
                  kind: resource.kind,
                  metadata: {
                    name: resource.metadata?.name,
                    namespace: resource.metadata?.namespace,
                  },
                })
                  .promise.then(() => {
                    close()
                  })
                  .catch((err) => {
                    console.error('Error updating resource: ', err)
                    setDeleteResourceError(err.message)
                  })
              } else {
                fireManagedClusterAction(
                  'Delete',
                  cluster,
                  resource.kind,
                  resource?.apiVersion,
                  resource.metadata?.name ?? '',
                  resource.metadata?.namespace ?? ''
                )
                  .then(async (actionResponse) => {
                    if (actionResponse.actionDone === 'ActionDone') {
                      close()
                    } else {
                      setDeleteResourceError(actionResponse.message)
                    }
                  })
                  .catch((err) => {
                    console.error('Error deleting resource: ', err)
                    setDeleteResourceError(err)
                  })
              }
              navigate(NavigationPath.search)
            }}
          >
            {t('Delete')}
          </AcmButton>,
          <AcmButton key="cancel" variant={ButtonVariant.secondary} onClick={close}>
            {t('Cancel')}
          </AcmButton>,
        ]}
      >
        {accessError && (
          <AcmAlert data-testid={'user-access-error'} noClose={true} variant={'danger'} title={accessError} />
        )}
        {!accessError && !canDelete && !loadingAccessRequest ? (
          <AcmAlert noClose={true} variant={'danger'} title={t('You are not authorized to delete this resource.')} />
        ) : null}
        {deleteResourceError ? (
          <AcmAlert
            data-testid={'delete-resource-error'}
            noClose={true}
            variant={'danger'}
            title={deleteResourceError}
          />
        ) : null}
        <div style={{ paddingTop: '1rem' }}>
          {t('Are you sure that you want to delete {{resourceName}}?', { resourceName: resource?.metadata?.name })}
        </div>
      </AcmModal>
    </Fragment>
  )
}
