/* Copyright Contributors to the Open Cluster Management project */

import { AcmModal } from '../../../../../ui-components'
import { Placement } from '../../../../../resources/placement'
import { useState } from 'react'
import { TFunction } from 'react-i18next'
import { deleteApplication } from '../../../../../lib/delete-application'
import { Alert, Button, List, ListItem } from '@patternfly/react-core'
import { ModalVariant } from '@patternfly/react-core/deprecated'
import { ApplicationSet } from '../../../../../resources/application-set'
import { Policy } from '../../../../../resources/policy'
import { GitOpsCluster } from '../../../../../resources/gitops-cluster'
import './DeletePlacementModal.css'
import { PolicySet } from '../../../../../resources/policy-set'

export interface IDeletePlacementModalProps {
  open: boolean
  canRemove: boolean
  resource: Placement
  close: () => void
  t: TFunction
  relatedAppSets: ApplicationSet[]
  relatedPolicies: Policy[]
  relatedPolicySets: PolicySet[]
  relatedGitOpsClusters: GitOpsCluster[]
}

export function DeletePlacementModal(props: IDeletePlacementModalProps | { open: false }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string>()

  if (!props.open) {
    return <></>
  }
  const {
    open,
    canRemove,
    resource,
    close,
    t,
    relatedAppSets,
    relatedPolicies,
    relatedPolicySets,
    relatedGitOpsClusters,
  } = props

  const handleClose = () => {
    setError(undefined)
    setIsDeleting(false)
    close()
  }

  const handleSubmit = async () => {
    setIsDeleting(true)
    setError(undefined)
    try {
      await deleteApplication(resource, [], undefined).promise
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setIsDeleting(false)
    }
  }

  return (
    <AcmModal
      id="delete-placement-modal"
      isOpen={open}
      onClose={handleClose}
      title={t('Permanently delete {{type}} {{name}}?', { type: t('placement'), name: resource.metadata?.name! })}
      titleIconVariant="warning"
      variant={ModalVariant.medium}
      position="top"
      actions={[
        <Button
          key="confirm"
          variant="danger"
          isDisabled={!canRemove || isDeleting}
          isLoading={isDeleting}
          onClick={handleSubmit}
        >
          {t('Delete')}
        </Button>,
        <Button key="cancel" variant="link" isDisabled={isDeleting} onClick={handleClose}>
          {t('Cancel')}
        </Button>,
      ]}
    >
      <div>
        {error && (
          <Alert variant="danger" title={t('Failed to delete placement')} isInline className="delete-placement-error">
            {error}
          </Alert>
        )}
        {t('Are you sure that you want to continue?')}
        {(relatedAppSets.length > 0 ||
          relatedPolicies.length > 0 ||
          relatedPolicySets.length > 0 ||
          relatedGitOpsClusters.length > 0) && (
          <div className="delete-placement-related-resources">
            {t('The following resources are using this placement and will be affected:')}
            <List className="delete-placement-related-resources-list">
              {relatedAppSets.map((appSet) => (
                <ListItem key={appSet.metadata.uid ?? `${appSet.metadata.namespace}-${appSet.metadata.name}`}>
                  {appSet.metadata.name} [{t('ApplicationSet')}]
                </ListItem>
              ))}
              {relatedPolicies.map((policy) => (
                <ListItem key={policy.metadata.uid ?? `${policy.metadata.namespace}-${policy.metadata.name}`}>
                  {policy.metadata.name} [{t('Policy')}]
                </ListItem>
              ))}
              {relatedPolicySets.map((policySet) => (
                <ListItem key={policySet.metadata.uid ?? `${policySet.metadata.namespace}-${policySet.metadata.name}`}>
                  {policySet.metadata.name} [{t('PolicySet')}]
                </ListItem>
              ))}
              {relatedGitOpsClusters.map((gitOpsCluster) => (
                <ListItem
                  key={
                    gitOpsCluster.metadata.uid ?? `${gitOpsCluster.metadata.namespace}-${gitOpsCluster.metadata.name}`
                  }
                >
                  {gitOpsCluster.metadata.name} [{t('GitOpsCluster')}]
                </ListItem>
              ))}
            </List>
          </div>
        )}
      </div>
    </AcmModal>
  )
}
