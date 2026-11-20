/* Copyright Contributors to the Open Cluster Management project */

import { useState } from 'react'
import { Alert, Button, Content, Stack, StackItem } from '@patternfly/react-core'
import { ModalVariant } from '@patternfly/react-core/deprecated'
import { useTranslation } from '~/lib/acm-i18next'
import type { GitOpsCluster } from '~/resources/gitops-cluster'
import { deleteResource } from '~/resources/utils'
import { AcmModal } from '~/ui-components'

export function DeleteGitOpsClusterModal({
  resource,
  onClose,
}: Readonly<{
  resource: GitOpsCluster
  onClose: () => void
}>) {
  const { t } = useTranslation()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string>()
  const handleClose = () => {
    if (!isDeleting) onClose()
  }
  const handleDelete = async () => {
    setIsDeleting(true)
    setError(undefined)
    try {
      await deleteResource(resource).promise
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setIsDeleting(false)
    }
  }

  return (
    <AcmModal
      id="delete-gitops-cluster"
      isOpen
      title={t('Delete GitOps configuration {{name}}?', { name: resource.metadata.name })}
      titleIconVariant="warning"
      variant={ModalVariant.medium}
      onClose={handleClose}
      actions={[
        <Button key="delete" variant="danger" isLoading={isDeleting} isDisabled={isDeleting} onClick={handleDelete}>
          {t('Delete')}
        </Button>,
        <Button key="cancel" variant="link" isDisabled={isDeleting} onClick={handleClose}>
          {t('Cancel')}
        </Button>,
      ]}
    >
      <Stack hasGutter>
        {error && (
          <StackItem>
            <Alert isInline variant="danger" title={t('Failed to delete GitOps configuration')}>
              {error}
            </Alert>
          </StackItem>
        )}
        <StackItem>
          <Content component="p">
            {t(
              'Deleting this GitOpsCluster stops registering its selected managed clusters with OpenShift GitOps. Are you sure that you want to continue?'
            )}
          </Content>
        </StackItem>
      </Stack>
    </AcmModal>
  )
}
