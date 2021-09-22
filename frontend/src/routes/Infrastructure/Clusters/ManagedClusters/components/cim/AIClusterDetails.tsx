/* Copyright Contributors to the Open Cluster Management project */
import { AcmExpandableCard } from '@open-cluster-management/ui-components'
import { CIM } from 'openshift-assisted-ui-lib'
import { useContext } from 'react'
import { ClusterContext } from '../../ClusterDetails/ClusterDetails'

const { ClusterPropertiesList } = CIM

const AIClusterDetails: React.FC = () => {
    const { clusterDeployment, agentClusterInstall } = useContext(ClusterContext)
    return (
        <div style={{ marginBottom: '24px', marginTop: '24px' }}>
            <AcmExpandableCard title="More cluster information" id="aidetails">
                {!!clusterDeployment && !!agentClusterInstall && (
                    <ClusterPropertiesList
                        leftItems={
                            [
                                /* TODO(jtomasek) */
                            ]
                        }
                        /*
                        name={clusterDeployment.metadata.name}
                        id={clusterDeployment.metadata.uid}
                        openshiftVersion={agentClusterInstall.spec.imageSetRef.name}
                        baseDnsDomain={clusterDeployment.spec?.baseDomain}
                        apiVip={agentClusterInstall?.spec?.apiVIP}
                        ingressVip={agentClusterInstall?.spec?.ingressVIP}
                        clusterNetworkCidr={agentClusterInstall.spec?.networking?.clusterNetwork?.[0]?.cidr}
                        clusterNetworkHostPrefix={agentClusterInstall.spec?.networking?.clusterNetwork?.[0]?.hostPrefix}
                        serviceNetworkCidr={agentClusterInstall.spec?.networking?.serviceNetwork?.[0]}
                        installedTimestamp={clusterDeployment.status?.installedTimestamp}
                        */
                    />
                )}
            </AcmExpandableCard>
        </div>
    )
}

export default AIClusterDetails
