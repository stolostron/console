/* Copyright Contributors to the Open Cluster Management project */
import { useCallback } from 'react'
import { patchResource } from '../../../../../../resources/utils'
import {
  useClusterDeployment,
  onSaveAgent,
  onSetInstallationDiskId,
} from '../../CreateCluster/components/assisted-installer/utils'
import { useSharedAtoms, useRecoilValue } from '../../../../../../shared-recoil'
import { IResource } from '../../../../../../resources'
import { AgentK8sResource, ScaleUpModal } from '@openshift-assisted/ui-lib/cim'

type ScaleUpDialogProps = {
  isOpen: boolean
  closeDialog: VoidFunction
  clusterName?: string
}

const ScaleUpDialog = ({ isOpen, closeDialog, clusterName }: ScaleUpDialogProps) => {
  const { agentsState, agentClusterInstallsState } = useSharedAtoms()
  const agents = useRecoilValue(agentsState)
  const agentClusterInstalls = useRecoilValue(agentClusterInstallsState)
  const clusterDeployment = useClusterDeployment({ name: clusterName, namespace: clusterName })

  const agentClusterInstall = agentClusterInstalls.find(
    (aci) =>
      aci.spec?.clusterDeploymentRef?.name === clusterDeployment?.metadata?.name &&
      aci.metadata?.namespace === clusterDeployment?.metadata?.namespace
  )

  const addHostsToCluster = useCallback(
    async (agentsToAdd: AgentK8sResource[]) => {
      const name = clusterDeployment?.metadata?.name
      const namespace = clusterDeployment?.metadata?.namespace

      if (!name || !namespace) throw new Error(`The cluster deployment ${clusterName} does not exist.`)

      const promises = agentsToAdd.map((agent) => {
        return patchResource(agent as IResource, [
          {
            op: agent.spec?.clusterDeploymentName ? 'replace' : 'add',
            path: '/spec/clusterDeploymentName',
            value: {
              name,
              namespace,
            },
          },
          {
            op: 'replace',
            path: '/spec/role',
            value: 'worker',
          },
        ]).promise
      })

      await Promise.all(promises)
    },
    [clusterDeployment, clusterName]
  )

  if (!clusterName || !isOpen || !clusterDeployment || !agents) {
    return null
  }

  return (
    <ScaleUpModal
      isOpen={isOpen}
      onClose={closeDialog}
      clusterDeployment={clusterDeployment}
      agents={agents}
      addHostsToCluster={addHostsToCluster}
      onChangeHostname={onSaveAgent}
      onSetInstallationDiskId={onSetInstallationDiskId}
      isNutanix={agentClusterInstall?.spec?.platformType === 'Nutanix'}
    />
  )
}

export default ScaleUpDialog
