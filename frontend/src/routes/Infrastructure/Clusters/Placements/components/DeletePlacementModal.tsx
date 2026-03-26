/* Copyright Contributors to the Open Cluster Management project */

import { AcmModal } from "../../../../../ui-components"
import { Placement } from "../../../../../resources/placement"
import { ReactNode } from "react"
import { TFunction } from "react-i18next"
import { deleteApplication } from "../../../../../lib/delete-application"
import { Button, List, ListItem } from "@patternfly/react-core"
import { ModalVariant } from "@patternfly/react-core/deprecated"
import { ApplicationSet } from "../../../../../resources/application-set"
import { Policy } from "../../../../../resources/policy"
import { GitOpsCluster } from "../../../../../resources/gitops-cluster"
import './DeletePlacementModal.css'

export interface IDeletePlacementModalProps {
  open: boolean
  canRemove: boolean
  resource: Placement
  errors: ReactNode
  loading: boolean
  close: () => void
  t: TFunction
  relatedAppSets: ApplicationSet[]
  relatedPolicies: Policy[]
  relatedGitOpsClusters: GitOpsCluster[]
}

export function DeletePlacementModal(props: IDeletePlacementModalProps | { open: false }) {
  if (!props.open) {
    return <></>
  }
  const { open, canRemove, resource, close, t, relatedAppSets, relatedPolicies, relatedGitOpsClusters } = props

  const handleSubmit = () => {
    close()
    return deleteApplication(resource, [], undefined)
  }

  return (
    <AcmModal
      id="delete-placement-modal"
      isOpen={open}
      onClose={close}
      title={t('Permanently delete placement {{name}}?', { name: resource.metadata?.name! })}
      titleIconVariant="warning"
      variant={ModalVariant.medium}
      position="top"
      actions={[
        <Button key="confirm" variant="danger" isDisabled={!canRemove} onClick={() => handleSubmit()}>
          {t('Delete')}
        </Button>,
        <Button key="cancel" variant="link" onClick={() => {
          close()
        }}>
          {t('Cancel')}
        </Button>,
      ]}
    >
      <div>
        {t('Are you sure that you want to continue?')}
        {(relatedAppSets.length > 0 || relatedPolicies.length > 0 || relatedGitOpsClusters.length > 0) && (
          <div className="delete-placement-related-resources">
            {t('The following resources are using this placement and will be affected:')}
            <List className="delete-placement-related-resources-list">
              {relatedAppSets.map((appSet) => (
                <ListItem key={appSet.metadata.uid}>
                  {appSet.metadata.name} [{t('ApplicationSet')}]
                </ListItem>
              ))}
              {relatedPolicies.map((policy) => (
                <ListItem key={policy.metadata.uid}>
                  {policy.metadata.name} [{t('Policy')}]
                </ListItem>
              ))}
              {relatedGitOpsClusters.map((gitOpsCluster) => (
                <ListItem key={gitOpsCluster.metadata.uid}>
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
