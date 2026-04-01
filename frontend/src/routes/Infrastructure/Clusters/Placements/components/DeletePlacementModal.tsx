/* Copyright Contributors to the Open Cluster Management project */

import { AcmAlert, AcmModal } from '../../../../../ui-components'
import { Placement } from '../../../../../resources/placement'
import { useState } from 'react'
import { deleteApplication } from '../../../../../lib/delete-application'
import { Alert, Button, List, ListItem } from '@patternfly/react-core'
import { ModalVariant } from '@patternfly/react-core/deprecated'
import { ApplicationSet } from '../../../../../resources/application-set'
import { Policy } from '../../../../../resources/policy'
import { GitOpsCluster } from '../../../../../resources/gitops-cluster'
import './DeletePlacementModal.css'
import { PolicySet } from '../../../../../resources/policy-set'
import { useTranslation } from '../../../../../lib/acm-i18next'

export interface IDeletePlacementModalProps {
  open: boolean
  resource: Placement
  close: () => void
  relatedAppSets: ApplicationSet[]
  relatedPolicies: Policy[]
  relatedPolicySets: PolicySet[]
  relatedGitOpsClusters: GitOpsCluster[]
  appSetFetchError?: string
}

export function DeletePlacementModal(props: IDeletePlacementModalProps | { open: false }) {
  const { t } = useTranslation()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string>()

  if (!props.open) {
    return <></>
  }
  const {
    open,
    resource,
    close,
    relatedAppSets,
    relatedPolicies,
    relatedPolicySets,
    relatedGitOpsClusters,
    appSetFetchError,
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
        <Button key="confirm" variant="danger" isDisabled={isDeleting} isLoading={isDeleting} onClick={handleSubmit}>
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
        {appSetFetchError && (
          <AcmAlert
            variant="warning"
            title={t('Failed to fetch ApplicationSets, the related resources list might not be accurate.')}
            message={appSetFetchError}
            isInline
            noClose
            className="delete-placement-error"
          />
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
                  {appSet.metadata.name} [ApplicationSet]
                </ListItem>
              ))}
              {relatedPolicies.map((policy) => (
                <ListItem key={policy.metadata.uid ?? `${policy.metadata.namespace}-${policy.metadata.name}`}>
                  {policy.metadata.name} [Policy]
                </ListItem>
              ))}
              {relatedPolicySets.map((policySet) => (
                <ListItem key={policySet.metadata.uid ?? `${policySet.metadata.namespace}-${policySet.metadata.name}`}>
                  {policySet.metadata.name} [PolicySet]
                </ListItem>
              ))}
              {relatedGitOpsClusters.map((gitOpsCluster) => (
                <ListItem
                  key={
                    gitOpsCluster.metadata.uid ?? `${gitOpsCluster.metadata.namespace}-${gitOpsCluster.metadata.name}`
                  }
                >
                  {gitOpsCluster.metadata.name} [GitOpsCluster]
                </ListItem>
              ))}
            </List>
          </div>
        )}
      </div>
    </AcmModal>
  )
}
