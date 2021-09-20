/* Copyright Contributors to the Open Cluster Management project */
import { CIM } from 'openshift-assisted-ui-lib'
import { useContext } from 'react'
import { ClusterContext } from '../../ClusterDetails/ClusterDetails'

const { ClusterErrors } = CIM

const AIClusterErrors: React.FC = () => {
    const { agentClusterInstall } = useContext(ClusterContext)
    return <ClusterErrors agentClusterInstall={agentClusterInstall} />
}

export default AIClusterErrors
