/* Copyright Contributors to the Open Cluster Management project */
import { CIM } from 'openshift-assisted-ui-lib'
import { useContext } from 'react'
import { ClusterContext } from '../../ClusterDetails/ClusterDetails'

const { ClusterErrors } = CIM

const AIClusterErrors: React.FC = () => {
    const { clusterDeployment, agentClusterInstall, agents } = useContext(ClusterContext)
    const clusterAgents = agents
        ? agents.filter(
              (a: CIM.AgentK8sResource) =>
                  a.spec.clusterDeploymentName?.name === clusterDeployment?.metadata.name &&
                  a.spec.clusterDeploymentName?.namespace === clusterDeployment?.metadata.namespace
          )
        : []

    return (
        <ClusterErrors
            clusterDeployment={clusterDeployment}
            agentClusterInstall={agentClusterInstall}
            clusterAgents={clusterAgents}
        />
    )
}

export default AIClusterErrors
