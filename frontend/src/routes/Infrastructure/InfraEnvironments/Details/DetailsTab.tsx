/* Copyright Contributors to the Open Cluster Management project */
import { AcmPageContent } from '@stolostron/ui-components'
import { Card, CardBody, PageSection } from '@patternfly/react-core'
import { CIM } from 'openshift-assisted-ui-lib'
import { useRecoilValue } from 'recoil'
import { configMapsState } from '../../../../atoms'
import { DOC_VERSION } from '../../../../lib/doc-util'
import { fetchSecret, getAIConfigMap, savePullSecret, saveSSHKey } from '../../Clusters/ManagedClusters/CreateCluster/components/assisted-installer/utils'

const { EnvironmentDetails, EnvironmentErrors } = CIM

type DetailsTabProps = {
    infraEnv: CIM.InfraEnvK8sResource
    infraAgents: CIM.AgentK8sResource[]
    bareMetalHosts: CIM.BareMetalHostK8sResource[]
}

const DetailsTab: React.FC<DetailsTabProps> = ({ infraEnv, infraAgents, bareMetalHosts }) => {
    const configMaps = useRecoilValue(configMapsState)
    const aiConfigMap = getAIConfigMap(configMaps)
    return (
        <AcmPageContent id="overview">
            <PageSection>
                <EnvironmentErrors infraEnv={infraEnv} docVersion={DOC_VERSION} />
                <Card>
                    <CardBody>
                        <EnvironmentDetails
                            infraEnv={infraEnv}
                            aiConfigMap={aiConfigMap}
                            fetchSecret={fetchSecret}
                            onEditPullSecret={savePullSecret}
                            onEditSSHKey={saveSSHKey}
                            hasAgents={!!infraAgents.length}
                            hasBMHs={!!bareMetalHosts.length}
                        />
                    </CardBody>
                </Card>
            </PageSection>
        </AcmPageContent>
    )
}

export default DetailsTab
