/* Copyright Contributors to the Open Cluster Management project */

import { ModalVariant } from '@patternfly/react-core/deprecated'
import { useCallback } from 'react'
import { EditArgoApplicationSet } from '~/routes/Applications/CreateArgoApplication/EditArgoApplicationSet'
import { useApplicationDetailsContext } from '~/routes/Applications/ApplicationDetails/ApplicationDetails'
import type { TopologyNode } from '~/routes/Applications/ApplicationDetails/ApplicationTopology/types'
import { AcmModal } from '~/ui-components'

export interface IEditAppSetModalProps {
  close: () => void
  open: boolean
  node: TopologyNode
  showWizardInput?: string
  onUpdateSuccess?: (nodeId: string) => void
}

interface ApplicationSetRouteParams {
  name: string
  namespace: string
}

export function topologyNodeToAppSetParams(
  node: TopologyNode,
  application?: { name?: string; namespace?: string }
): ApplicationSetRouteParams {
  if (node.type === 'applicationset') {
    return {
      name: node.name ?? '',
      namespace: node.namespace ?? '',
    }
  }

  if (node.type === 'placement') {
    return {
      name: application?.name ?? '',
      namespace: node.namespace ?? application?.namespace ?? '',
    }
  }

  return {
    name: application?.name ?? node.name ?? '',
    namespace: application?.namespace ?? node.namespace ?? '',
  }
}

export function EditAppSetModal(props: IEditAppSetModalProps | { open: false }) {
  if (props.open === false) {
    return null
  }

  return <EditAppSetModalContent {...props} />
}

function EditAppSetModalContent({ close, node, onUpdateSuccess }: IEditAppSetModalProps) {
  const { applicationData } = useApplicationDetailsContext()
  const { name, namespace } = topologyNodeToAppSetParams(node, applicationData?.application)
  const handleClose = useCallback(() => close(), [close])
  const handleSubmitSuccess = useCallback(() => {
    onUpdateSuccess?.(node.id ?? '')
    handleClose()
  }, [handleClose, node.id, onUpdateSuccess])
  const modalTitle = [namespace, name].filter(Boolean).join(' > ')

  return (
    <AcmModal
      id="edit-appset-modal"
      isOpen={true}
      title={modalTitle}
      aria-label={modalTitle}
      showClose={true}
      onClose={close}
      variant={ModalVariant.large}
      position="top"
      hasNoBodyWrapper
    >
      <div
        style={{
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          height: '80vh',
          maxHeight: '80vh',
          overflow: 'hidden',
          paddingTop: 'var(--pf-t--global--spacer--sm)',
          paddingRight: 'var(--pf-t--global--spacer--lg)',
          paddingBottom: 'var(--pf-t--global--spacer--lg)',
          paddingLeft: 'var(--pf-t--global--spacer--lg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <EditArgoApplicationSet
            name={name}
            namespace={namespace}
            isModal={true}
            onCancel={handleClose}
            onSubmitSuccess={handleSubmitSuccess}
            onApplicationSetNotFound={handleClose}
          />
        </div>
      </div>
    </AcmModal>
  )
}
